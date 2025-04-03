const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Login = require("../schema/login");
const Student = require("../schema/student");
const Teacher = require("../schema/teacher");
const Course = require("../schema/course");
const Admin = require("../schema/admin");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

exports.login = async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }
  try {
    const user = await Login.findOne({ username, role }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    if (!user.roleId) {
      return res
        .status(400)
        .json({ message: "Invalid user data: roleId missing." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, roleId: user.roleId },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    let profile;
    if (role === "student") {
      profile = await Student.findById(user.roleId)
        .populate("courseEnrolled") // Fetch full course details
        .lean();
      if (profile) {
        // Fetch completed courses with details
        if (
          profile.completedCourses &&
          Array.isArray(profile.completedCourses) &&
          profile.completedCourses.length > 0
        ) {
          const completedCourseIds = profile.completedCourses.map(
            (item) => item.courseId
          );
          const completedCourses = await Course.find({
            _id: { $in: completedCourseIds },
          }).lean();

          profile.completedCourses = profile.completedCourses.map((item) => ({
            ...item,
            course:
              completedCourses.find(
                (c) => c._id.toString() === item.courseId.toString()
              ) || null,
          }));
        } else {
          profile.completedCourses = [];
        }

        // Fetch enrolled courses separately
        profile.courseEnrolled = profile.courseEnrolled || [];
      }
    } else if (role === "teacher") {
      profile = await Teacher.findById(user.roleId)
        .populate("coursesTaught") // Populate course details
        .lean();
    } else if (role === "admin") {
      profile = await Admin.findById(user.roleId).lean();
    } else {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }
    delete profile.password;

    res.status(200).json({
      message: "Login successful.",
      token,
      profile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during login.", error: error.message });
  }
};

// Forgot Password Controller
exports.forgotPassword = async (req, res) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ message: "Username and role are required." });
  }

  try {
    // 1. Find user in Login collection
    const user = await Login.findOne({ username, role });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Fetch email from profile (Student/Teacher/Admin)
    let profile;
    switch (role) {
      case "student":
        profile = await Student.findOne({ studentId: username });
        break;
      case "teacher":
        profile = await Teacher.findOne({ teacherId: username });
        break;
      case "admin":
        profile = await Admin.findOne({ adminId: username });
        break;
      default:
        return res.status(400).json({ message: "Invalid role." });
    }

    if (!profile?.email) {
      return res.status(404).json({ message: "User email not found." });
    }

    // 3. Generate and save reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    user.forgotPasswordToken = resetToken;
    user.forgotPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    await user.save();

    // 4. Configure Nodemailer with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,  // "gmail" (alternatively, use `host` and `port`)
      host: process.env.SMTP_HOST,        // smtp.gmail.com
      port: process.env.SMTP_PORT,        // 465
      secure: true,                       // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL,      // ankitguitar204@gmail.com
        pass: process.env.SMTP_PASSWORD,  // Your App Password
      },
    });

    // 5. Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: profile.email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p><strong>Link expires in 15 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({
      message: "Failed to send reset email. Please try again later.",
      error: error.message,
    });
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  const { token } = req.params; // Token from URL (e.g., /reset-password/:token)
  const { newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token is required." });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ 
      message: "Password must be at least 6 characters long." 
    });
  }

  try {
    // 1. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Find the user with the token and check expiry
    const user = await Login.findOne({
      _id: decoded.id,
      forgotPasswordToken: token,
      forgotPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token." 
      });
    }

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update user's password and clear the reset token
    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpires = undefined;
    await user.save();

    // 5. Respond with success
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Reset token has expired." });
    }
    res.status(500).json({ 
      message: "Error resetting password.", 
      error: error.message 
    });
  }
};