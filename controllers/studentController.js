const jwt = require("jsonwebtoken");
const Class = require("../schema/class");  // Assuming Class model path

// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
// exports.rescheduleClass = async (req, res) => {
//   const { classId, newDateTime, newTimezone } = req.body;

//   if (!classId || !newDateTime || !newTimezone) {
//     return res.status(400).json({ message: "All fields are required." });
//   }

//   try {
//     // Step 1: Verify the JWT token
//     const token = req.headers.authorization?.split(" ")[1]; // Extract token from header
//     if (!token) {
//       return res.status(401).json({ message: "Token is required." });
//     }

//     const decodedToken = jwt.verify(token, JWT_SECRET); // Decode the token
//     const studentId = decodedToken.id; // Extract the studentId from the token

//     // Step 2: Check if the classId is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(classId)) {
//       return res.status(400).json({ message: "Invalid class ID." });
//     }

//     // Step 3: Fetch the class and populate the studentIds array
//     const classToUpdate = await Class.findById(classId).populate("studentIds");
//     if (!classToUpdate) {
//       return res.status(404).json({ message: "Class not found." });
//     }

//     // Debugging: Log studentIds in the class
//     console.log("Class studentIds:", classToUpdate.studentIds);

//     // Step 4: Check if the student is enrolled in this class
//     const studentObjectId = new mongoose.Types.ObjectId(studentId);  // Correct way to convert to ObjectId
//     console.log("Student ObjectId from token:", studentObjectId); // Debugging log

//     // Ensure student is enrolled in the class
//     const studentEnrolled = classToUpdate.studentIds.some(student =>
//       student._id.equals(studentObjectId)  // Compare ObjectIds
//     );

//     // Debugging log to check if the student is enrolled
//     console.log("Is student enrolled?", studentEnrolled);

//     if (!studentEnrolled) {
//       return res.status(403).json({ message: "You are not enrolled in this class." });
//     }

//     // Step 5: Update the class schedule
//     classToUpdate.scheduledDateTime = new Date(newDateTime);
//     classToUpdate.timezone = newTimezone;

//     await classToUpdate.save();

//     res.status(200).json({
//       message: "Class rescheduled successfully.",
//       updatedClass: classToUpdate,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "Error rescheduling class.",
//       error: error.message,
//     });
//   }
// };


exports.rescheduleClass = async (req, res) => {
  try {
    // Extract JWT token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Verify and decode the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token. Authentication failed." });
    }

    const studentId = decoded.roleId;  // Assuming roleId stores student ID
    if (!studentId) {
      return res.status(401).json({ message: "Token is missing student ID." });
    }

    // Extract classId from URL params
    const { classId } = req.params;
    if (!classId) {
      return res.status(400).json({ message: "Class ID is required in the URL." });
    }

    // Extract newScheduledDateTime and timezone from the body
    const { newScheduledDateTime, timezone } = req.body;
    if (!newScheduledDateTime || !timezone) {
      return res.status(400).json({ message: "New scheduled date/time and timezone are required." });
    }

    // Validate newScheduledDateTime format
    const validDateTime = Date.parse(newScheduledDateTime);
    if (isNaN(validDateTime)) {
      return res.status(400).json({ message: "Invalid date/time format." });
    }

    // Validate timezone
    const validTimezones = ["UTC", "EST", "PST", "CET", "IST"]; // Example list, adjust based on your application
    if (!validTimezones.includes(timezone)) {
      return res.status(400).json({ message: "Invalid timezone provided." });
    }

    // Check if the new scheduled date is not in the past
    if (newScheduledDateTime < new Date().toISOString()) {
      return res.status(400).json({ message: "The new scheduled date/time cannot be in the past." });
    }

    // Find the class where the student is enrolled
    const assignedClass = await Class.findOne({ _id: classId, studentIds: studentId });
    if (!assignedClass) {
      return res.status(404).json({ message: "Class not found or unauthorized access." });
    }

    // Check if the class is already rescheduled or has been canceled
    if (assignedClass.status === 'canceled') {
      return res.status(400).json({ message: "This class has been canceled and cannot be rescheduled." });
    }

    // Check if the new date/time conflicts with another class
    const conflictingClass = await Class.findOne({
      studentIds: studentId,
      scheduledDateTime: newScheduledDateTime,
      status: { $ne: 'canceled' },
    });
    if (conflictingClass) {
      return res.status(400).json({ message: "The new scheduled date/time conflicts with another class." });
    }

    // Update class schedule and timezone
    assignedClass.scheduledDateTime = newScheduledDateTime;
    assignedClass.timezone = timezone;
    await assignedClass.save();

    res.status(200).json({
      message: "Class rescheduled successfully.",
      updatedClass: assignedClass,
    });
  } catch (error) {
    console.error("Error rescheduling class:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
