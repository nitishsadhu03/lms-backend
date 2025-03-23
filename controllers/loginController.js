const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Login = require("../schema/login");
const Student = require("../schema/student");
const Teacher = require("../schema/teacher");
const Course = require("../schema/course");
const Admin = require("../schema/admin");

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
    const user = await Login.findOne({ username, role });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    user.forgotPasswordToken = resetToken;
    user.forgotPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset token generated successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error processing forgot password.",
      error: error.message,
    });
  }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token is required." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Login.findById(decoded.id).select(
      "+forgotPasswordToken +forgotPasswordExpires"
    );
    if (
      !user ||
      user.forgotPasswordToken !== token ||
      user.forgotPasswordExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resetting password.", error: error.message });
  }
};
