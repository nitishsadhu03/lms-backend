const Student = require("../schema/student");
const Teacher = require("../schema/teacher");
const Admin = require("../schema/admin");
const Course = require("../schema/course");
const Class = require("../schema/class");
const Resource = require("../schema/resource");
const Homework = require("../schema/homework");
const Payment = require("../schema/payment");
const Recording = require("../schema/recording");
const bcrypt = require("bcryptjs");
const Login = require("../schema/login");
const Batch = require("../schema/batch");
const Announcement = require("../schema/announcement");
const Session = require("../schema/session");
const Certificate = require("../schema/certificate");
const mongoose = require("mongoose");
const { validateBase64Image } = require("../middlewares/baseImageMiddleware");

// Helper function to validate required fields
const validateFields = (requiredFields, data) => {
  return requiredFields.every(
    (field) => data[field] !== undefined && data[field] !== null
  );
};

// Admin creates a new student with password
exports.createStudent = async (req, res) => {
  const {
    studentId,
    name,
    email,
    age,
    sex,
    parentName,
    courseEnrolled,
    timezone,
    profileImage,
    password,
  } = req.body;

  // Validate required fields
  if (
    !validateFields(
      ["studentId", "name", "email", "age", "sex", "timezone", "password"],
      req.body
    )
  ) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided." });
  }

  try {
    // Check if student or email already exists
    const existingStudent = await Student.findOne({
      $or: [{ studentId }, { email }],
    });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this ID or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the student entry
    const student = new Student({
      studentId,
      name,
      email,
      age,
      sex,
      parentName,
      courseEnrolled,
      timezone,
      profileImage,
    });
    await student.save();

    const login = new Login({
      username: studentId,
      password: hashedPassword,
      role: "student",
      roleId: student._id, // Reference to the student document
    });
    await login.save();

    res
      .status(201)
      .json({ message: "Student created successfully.", student, login });
  } catch (error) {
    console.error("Error creating student:", error);
    res
      .status(500)
      .json({ message: "Error creating student.", error: error.message });
  }
};

// Admin creates a new Teacher
exports.createTeacher = async (req, res) => {
  const {
    teacherId,
    name,
    email,
    age,
    sex,
    timezone,
    profileImage,
    password,
    coursesTaught, // Add coursesTaught to the destructured fields
  } = req.body;

  // Validate required fields
  if (
    !validateFields(
      ["teacherId", "name", "email", "age", "sex", "timezone", "password"],
      req.body
    )
  ) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided." });
  }

  try {
    // Check if a teacher with the same teacherId or email already exists
    const existingTeacher = await Teacher.findOne({
      $or: [{ teacherId }, { email }],
    });
    if (existingTeacher) {
      return res
        .status(400)
        .json({ message: "Teacher with this ID or email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new teacher instance
    const teacher = new Teacher({
      teacherId,
      name,
      email,
      age,
      sex,
      timezone,
      profileImage,
      coursesTaught: coursesTaught || [], // Set coursesTaught to an empty array if not provided
    });

    // Save the teacher to the database
    await teacher.save();

    // Create a login entry for the teacher
    const login = new Login({
      username: teacherId,
      password: hashedPassword,
      role: "teacher",
      roleId: teacher._id,
    });
    await login.save();

    // Return success response
    res
      .status(201)
      .json({ message: "Teacher created successfully.", teacher, login });
  } catch (error) {
    // Handle errors
    res
      .status(500)
      .json({ message: "Error creating teacher.", error: error.message });
  }
};

// Admin creates another Admin
exports.createAdmin = async (req, res) => {
  const { adminId, name, email, age, sex, profileImage, password } = req.body;

  if (
    !validateFields(
      ["adminId", "name", "email", "age", "sex", "password"],
      req.body
    )
  ) {
    return res
      .status(400)
      .json({ message: "All required fields must be provided." });
  }

  try {
    const existingAdmin = await Admin.findOne({
      $or: [{ adminId }, { email }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this ID or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin entry
    const admin = new Admin({
      adminId,
      name,
      email,
      age,
      sex,
      profileImage,
    });
    await admin.save();

    // Create login entry for the admin
    const login = new Login({
      username: adminId,
      password: hashedPassword,
      role: "admin",
      roleId: admin._id,
    });
    await login.save();

    res
      .status(201)
      .json({ message: "Admin created successfully.", admin, login });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating admin.", error: error.message });
  }
};

// Admin creates a new Course
exports.createCourse = async (req, res) => {
  const {
    name,
    numberOfSessions,
    // teacher,
    // students
  } = req.body;

  if (!name || !numberOfSessions) {
    return res
      .status(400)
      .json({ message: "Name and number of sessions are required." });
  }

  try {
    // Check if the course already exists by name
    const existingCourse = await Course.findOne({ name });
    if (existingCourse) {
      return res
        .status(400)
        .json({ message: "Course with this name already exists." });
    }

    // Check if the teacher exists
    // const teacherExists = await Teacher.findById(teacher);
    // if (!teacherExists) {
    //   return res.status(400).json({ message: 'Teacher does not exist.' });
    // }

    // Check if all students exist
    // if (students && students.length > 0) {
    //   const studentCheck = await Student.find({ _id: { $in: students } });
    //   if (studentCheck.length !== students.length) {
    //     return res.status(400).json({ message: 'Some students do not exist.' });
    //   }
    // }

    // Create the new course
    const newCourse = new Course({
      name,
      numberOfSessions,
      // teacher,
      // students,
    });

    await newCourse.save();

    res
      .status(201)
      .json({ message: "Course created successfully.", course: newCourse });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating course.", error: error.message });
  }
};

exports.editCourse = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    numberOfSessions,
    // teacher,
    // students
  } = req.body;

  if (!name || !numberOfSessions) {
    return res
      .status(400)
      .json({ message: "Name and number of sessions are required." });
  }

  try {
    // Check if the course exists
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Check if the new name is already taken by another course
    if (name !== course.name) {
      const existingCourse = await Course.findOne({ name });
      if (existingCourse) {
        return res
          .status(400)
          .json({ message: "Another course with this name already exists." });
      }
    }

    // Check if the teacher exists (if uncommented)
    // if (teacher) {
    //   const teacherExists = await Teacher.findById(teacher);
    //   if (!teacherExists) {
    //     return res.status(400).json({ message: 'Teacher does not exist.' });
    //   }
    // }

    // Check if all students exist (if uncommented)
    // if (students && students.length > 0) {
    //   const studentCheck = await Student.find({ _id: { $in: students } });
    //   if (studentCheck.length !== students.length) {
    //     return res.status(400).json({ message: 'Some students do not exist.' });
    //   }
    // }

    // Update the course
    course.name = name;
    course.numberOfSessions = numberOfSessions;
    // if (teacher) course.teacher = teacher;
    // if (students) course.students = students;

    await course.save();

    res
      .status(200)
      .json({ message: "Course updated successfully.", course });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating course.", error: error.message });
  }
};

// Helper function to generate sessions for recurring classes
const generateSessions = async (classData) => {
  const sessions = [];
  let currentDate = new Date(classData.startDate);
  let sessionCount = 0;

  while (sessionCount < classData.numberOfSessions) {
    if (classData.repeatType === "weekly") {
      const dayOfWeek = currentDate.toLocaleString("en-US", {
        weekday: "long",
      });
      const repeatDay = classData.repeatDays.find(
        (day) => day.day === dayOfWeek
      );
      if (repeatDay) {
        const session = new Session({
          classId: classData._id,
          startDateTime: new Date(
            currentDate.toISOString().split("T")[0] +
              `T${repeatDay.startTime}:00Z`
          ),
          endDateTime: new Date(
            currentDate.toISOString().split("T")[0] +
              `T${repeatDay.endTime}:00Z`
          ),
        });
        await session.save();
        sessions.push(session._id);
        sessionCount++;
      }
    } else if (classData.repeatType === "monthly") {
      const currentDateOfMonth = currentDate.getDate();
      const repeatDate = classData.repeatDates.find(
        (date) => date.date === currentDateOfMonth
      );
      if (repeatDate) {
        const session = new Session({
          classId: classData._id,
          startDateTime: new Date(
            currentDate.toISOString().split("T")[0] +
              `T${repeatDate.startTime}:00Z`
          ),
          endDateTime: new Date(
            currentDate.toISOString().split("T")[0] +
              `T${repeatDate.endTime}:00Z`
          ),
        });
        await session.save();
        sessions.push(session._id);
        sessionCount++;
      }
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
};

// Create a class (single or recurring)
exports.createClass = async (req, res) => {
  const {
    batchId,
    classLink,
    teacherId,
    studentIds,
    isRecurring,
    startDate,
    startDateTime,
    endDateTime,
    repeatType,
    repeatDays,
    repeatDates,
    numberOfSessions,
    courseId,
  } = req.body;

  try {
    // Validate teacher
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Validate students
    const students = await Student.find({ _id: { $in: studentIds } });
    // if (students.length !== studentIds.length) {
    //   return res.status(404).json({ message: "Some students not found." });
    // }

    // Create the class
    const newClass = new Class({
      batchId,
      classLink,
      teacherId,
      studentIds,
      isRecurring,
      startDate: isRecurring ? new Date(startDate) : null,
      startDateTime: !isRecurring ? new Date(startDateTime) : null,
      endDateTime: !isRecurring ? new Date(endDateTime) : null,
      repeatType,
      repeatDays,
      repeatDates,
      numberOfSessions,
      courseId,
      adminId: req.user._id, // Admin who created the class
    });

    await newClass.save();

    // Generate sessions for recurring classes
    if (isRecurring) {
      const sessions = await generateSessions(newClass);
      newClass.sessions = sessions;
      await newClass.save();
    }

    res.status(201).json({
      message: "Class created successfully.",
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating class.",
      error: error.message,
    });
  }
};

// create class --> This is working fine
// exports.createClass = async (req, res) => {
//   const {
//     title,
//     teacherId,
//     students = [],
//     classLink,
//     isRecurring,
//     recurrencePattern,
//     duration,
//     totalSessions,
//     startTime, // Add explicit startTime field for single classes
//     endTime, // Add explicit endTime field for single classes
//   } = req.body;

//   if (!title || !teacherId || !classLink) {
//     return res.status(400).json({
//       message: "Required fields missing.",
//     });
//   }

//   try {
//     // Get the admin ID from the authenticated admin
//     const adminId = req.user._id;

//     // Validate teacher
//     const teacher = await Teacher.findById(teacherId);
//     if (!teacher) {
//       return res.status(404).json({ message: "Teacher not found." });
//     }

//     // Validate students if provided
//     if (students.length > 0) {
//       const foundStudents = await Student.find({ _id: { $in: students } });
//       if (foundStudents.length !== students.length) {
//         return res.status(404).json({ message: "Some students not found." });
//       }
//     }

//     // Generate batchId
//     // const batchId = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
//     const batchId = title;

//     // Create the class with enhanced fields
//     const newClass = new Class({
//       batchId,
//       title,
//       teacherId,
//       students,
//       classLink,
//       isRecurring,
//       // Handle time fields for both recurring and non-recurring classes
//       recurrencePattern: isRecurring ? recurrencePattern : undefined,
//       startTime: isRecurring ? recurrencePattern?.startTime : startTime, // Use appropriate start time
//       endTime: isRecurring ? recurrencePattern?.endTime : endTime, // Use appropriate end time
//       duration,
//       totalSessions: isRecurring ? totalSessions : 1,
//       // For single classes, calculate nextSessionDate based on startTime
//       nextSessionDate: isRecurring
//         ? recurrencePattern?.startDate
//         : startTime
//         ? new Date(startTime)
//         : undefined,
//       adminId, // Associate the class with the authenticated admin
//     });

//     await newClass.save();

//     res.status(201).json({
//       message: "Class created successfully.",
//       class: newClass,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating class.",
//       error: error.message,
//     });
//   }
// };

// delete class
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID." });
    }

    const classToDelete = await Class.findById(id);
    if (!classToDelete) {
      return res.status(404).json({ message: "Class not found." });
    }

    // If it's a recurring class, delete associated batch and schedules
    // if (classToDelete.isRecurring) {
    //   await Batch.findOneAndDelete({ batchId: classToDelete.batchId });
    //   await Schedule.deleteMany({ batchId: classToDelete.batchId });
    // }

    await Class.findByIdAndDelete(id);

    res.status(200).json({ message: "Class deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting class.",
      error: error.message,
    });
  }
};

// Reschedule class function
// exports.rescheduleClass = async (req, res) => {
//   const { classId } = req.params;
//   const { newStartDate, newEndDate } = req.body;

//   if (!classId || !newStartDate || !newEndDate) {
//     return res.status(400).json({
//       message: "Class ID, new start date, and new end date are required."
//     });
//   }

//   try {
//     const classToReschedule = await Class.findById(classId);
//     if (!classToReschedule) {
//       return res.status(404).json({ message: "Class not found." });
//     }

//     // Validate new dates
//     const newStartDateTime = new Date(newStartDate);
//     const newEndDateTime = new Date(newEndDate);

//     if (newStartDateTime <= new Date()) {
//       return res.status(400).json({
//         message: "New start date must be in the future."
//       });
//     }

//     if (newEndDateTime <= newStartDateTime) {
//       return res.status(400).json({
//         message: "New end date must be after new start date."
//       });
//     }

//     if (classToReschedule.isRecurring) {
//       // Update recurring pattern dates
//       classToReschedule.recurrencePattern.startDate = newStartDateTime;
//       classToReschedule.recurrencePattern.endDate = newEndDateTime;
//     }

//     await classToReschedule.save();

//     res.status(200).json({
//       message: "Class rescheduled successfully.",
//       class: classToReschedule
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error rescheduling class.",
//       error: error.message
//     });
//   }
// };

// exports.rescheduleClass = async (req, res) => {
//   const { classId } = req.params;
//   const { newStartDate, newEndDate } = req.body;

//   // Validate required fields
//   if (!classId || !newStartDate || !newEndDate) {
//     return res.status(400).json({
//       message: "Class ID, new start date, and new end date are required."
//     });
//   }

//   try {
//     // Validate new dates
//     const newStartDateTime = new Date(newStartDate);
//     const newEndDateTime = new Date(newEndDate);

//     if (isNaN(newStartDateTime.getTime()) || isNaN(newEndDateTime.getTime())) {
//       return res.status(400).json({
//         message: "Invalid date format. Please provide valid ISO date strings."
//       });
//     }

//     if (newStartDateTime <= new Date()) {
//       return res.status(400).json({
//         message: "New start date must be in the future."
//       });
//     }

//     if (newEndDateTime <= newStartDateTime) {
//       return res.status(400).json({
//         message: "New end date must be after new start date."
//       });
//     }

//     // Find the class to reschedule
//     const classToReschedule = await Class.findById(classId);
//     if (!classToReschedule) {
//       return res.status(404).json({ message: "Class not found." });
//     }

//     // Handle single class rescheduling
//     if (!classToReschedule.isRecurring) {
//       classToReschedule.startTime = newStartDateTime;
//       classToReschedule.endTime = newEndDateTime;
//       classToReschedule.nextSessionDate = newStartDateTime; // Update next session date
//     }
//     // Handle recurring class rescheduling
//     else {
//       // Update recurrence pattern dates
//       classToReschedule.recurrencePattern.startDate = newStartDateTime;
//       classToReschedule.recurrencePattern.endDate = newEndDateTime;

//       // Recalculate nextSessionDate based on the new startDate
//       classToReschedule.nextSessionDate = newStartDateTime;
//     }

//     // Save the updated class
//     await classToReschedule.save();

//     res.status(200).json({
//       message: "Class rescheduled successfully.",
//       class: classToReschedule
//     });
//   } catch (error) {
//     console.error("Error rescheduling class:", error);
//     res.status(500).json({
//       message: "Error rescheduling class.",
//       error: error.message
//     });
//   }
// };

// this was working-> REschedule class
// exports.rescheduleClass = async (req, res) => {
//   const { classId, sessionNumber } = req.params;
//   const { newDate } = req.body;

//   if (!classId || sessionNumber === undefined || !newDate) {
//     return res.status(400).json({ message: "Required fields missing." });
//   }

//   try {
//     const classToReschedule = await Class.findById(classId);
//     if (!classToReschedule) {
//       return res.status(404).json({ message: "Class not found." });
//     }

//     const newDateTime = new Date(newDate);
//     if (isNaN(newDateTime.getTime())) {
//       return res.status(400).json({ message: "Invalid date format." });
//     }

//     if (newDateTime <= new Date()) {
//       return res
//         .status(400)
//         .json({ message: "New date must be in the future." });
//     }

//     if (!classToReschedule.isRecurring) {
//       // Single-use class update
//       classToReschedule.startTime = newDateTime;
//       classToReschedule.nextSessionDate = newDateTime;
//     } else {
//       // Ensure customRescheduleDates array exists
//       if (!classToReschedule.customRescheduleDates) {
//         classToReschedule.customRescheduleDates = [];
//       }

//       // Find session
//       const sessionIndex = classToReschedule.customRescheduleDates.findIndex(
//         (s) => s.sessionNumber === Number(sessionNumber)
//       );

//       if (sessionIndex !== -1) {
//         // Update existing session
//         classToReschedule.customRescheduleDates[sessionIndex].newDate =
//           newDateTime;
//       } else {
//         // Add new reschedule entry
//         classToReschedule.customRescheduleDates.push({
//           sessionNumber: Number(sessionNumber),
//           newDate: newDateTime,
//         });
//       }
//     }

//     await classToReschedule.save();

//     res.status(200).json({
//       message: `Class session ${sessionNumber} rescheduled successfully.`,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error rescheduling class.", error: error.message });
//   }
// };

// Reschedule a single class or a session in a recurring class
exports.rescheduleClassOrSession = async (req, res) => {
  const { classId, sessionId, newStartDateTime, newEndDateTime } = req.body;

  try {
    if (sessionId) {
      // Reschedule a session in a recurring class
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found." });
      }

      session.isRescheduled = true;
      session.rescheduledDateTime = new Date(newStartDateTime);
      session.startDateTime = new Date(newStartDateTime);
      session.endDateTime = new Date(newEndDateTime);
      await session.save();

      res.status(200).json({
        message: "Session rescheduled successfully.",
        session,
      });
    } else {
      // Reschedule a single class
      const classData = await Class.findById(classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found." });
      }

      classData.isRescheduled = true;
      classData.originalStartDateTime = classData.startDateTime;
      classData.originalEndDateTime = classData.endDateTime;
      classData.startDateTime = new Date(newStartDateTime);
      classData.endDateTime = new Date(newEndDateTime);
      await classData.save();

      res.status(200).json({
        message: "Class rescheduled successfully.",
        class: classData,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error rescheduling class/session.",
      error: error.message,
    });
  }
};

// Update class function for other details like class name and all. not for rescheduling
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      teacherId,
      students,
      classLink,
      isRecurring,
      recurrencePattern,
      duration,
      totalSessions,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class ID." });
    }

    const classToUpdate = await Class.findById(id);
    if (!classToUpdate) {
      return res.status(404).json({ message: "Class not found." });
    }

    // Validate teacher if being updated
    if (teacherId) {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: "Invalid teacher ID." });
      }
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found." });
      }
    }

    // Validate students if being updated
    if (students && students.length > 0) {
      const validStudentIds = students.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      const foundStudents = await Student.find({
        _id: { $in: validStudentIds },
      });
      if (foundStudents.length !== validStudentIds.length) {
        return res.status(404).json({ message: "Some students not found." });
      }
    }

    // Validate recurrence pattern if being updated
    if (recurrencePattern) {
      const startDate = new Date(recurrencePattern.startDate);
      const endDate = new Date(recurrencePattern.endDate);

      if (startDate <= new Date()) {
        return res.status(400).json({
          message: "Start date must be in the future.",
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          message: "End date must be after start date.",
        });
      }
    }

    // Update fields if provided
    if (title) classToUpdate.title = title;
    if (teacherId) classToUpdate.teacherId = teacherId;
    if (students) classToUpdate.students = students;
    if (classLink) classToUpdate.classLink = classLink;
    if (typeof isRecurring !== "undefined")
      classToUpdate.isRecurring = isRecurring;
    if (recurrencePattern && classToUpdate.isRecurring) {
      classToUpdate.recurrencePattern = {
        ...classToUpdate.recurrencePattern,
        ...recurrencePattern,
      };
    }
    if (duration) classToUpdate.duration = duration;
    if (totalSessions) classToUpdate.totalSessions = totalSessions;
    if (status) classToUpdate.status = status;

    await classToUpdate.save();

    res.status(200).json({
      message: "Class updated successfully.",
      class: classToUpdate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating class.",
      error: error.message,
    });
  }
};

// helper function for certificate eligiblity check
const areAllSessionsPaid = async (classId) => {
  const sessions = await Session.find({ classId });
  return sessions.every((session) => session.adminUpdates.type === "paid");
};


// Admin updates a class or session
exports.updateClassOrSessionByAdmin = async (req, res) => {
  const { classId, sessionId, amount, type, joinTime, penalty } = req.body;

  try {
    if (sessionId) {
      // Update a session (for recurring classes)
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found." });
      }

      // Find the class associated with this session
      const classData = await Class.findById(session.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found." });
      }

      // Find the teacher associated with this class
      const teacher = await Teacher.findById(classData.teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found." });
      }

      // Only update fields that are provided
      if (amount !== undefined) {
        session.adminUpdates.amount = amount;
        teacher.totalEarnings += amount; // Add the amount to the teacher's totalEarnings
      }
      if (type !== undefined) session.adminUpdates.type = type;
      if (joinTime !== undefined)
        session.adminUpdates.joinTime = new Date(joinTime);
      if (penalty !== undefined) session.adminUpdates.penalty = penalty;

      await session.save();
      await teacher.save();

      // Check if all sessions in the recurring class are marked as "paid"
      const allSessionsPaid = await areAllSessionsPaid(session.classId);
      if (allSessionsPaid) {
        // Find the student enrolled in this class
        const studentId = classData.studentIds[0]; // Assuming one student per class
        const student = await Student.findById(studentId);
        if (!student) {
          return res.status(404).json({ message: "Student not found." });
        }

        // Generate a unique certificate ID
        const certificateNumber = `CERT-${Date.now()}-${studentId}`;

        // Create the certificate
        const certificate = new Certificate({
          studentId,
          courseId: classData.courseId,
          certificateNumber, // Include the unique certificate number
          completionPercentage: 100, // Since all sessions are completed
        });

        await certificate.save();

        // Update the student's certificates array
        student.certificates.push({
          courseId: classData.courseId,
          certificateUrl: `https://example.com/certificates/${certificateNumber}`, // Replace with actual URL logic
          issuedAt: Date.now(),
          isEligible: true,
        });

        await student.save();
      }

      res.status(200).json({
        message: "Session updated successfully by admin.",
        session,
      });
    } else {
      // Update a single class
      const singleClass = await Class.findById(classId);
      if (!singleClass) {
        return res.status(404).json({ message: "Class not found." });
      }

      // Find the teacher associated with this class
      const teacher = await Teacher.findById(singleClass.teacherId);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found." });
      }

      // Only update fields that are provided
      if (amount !== undefined) {
        singleClass.adminUpdates.amount = amount;
        teacher.totalEarnings += amount; // Add the amount to the teacher's totalEarnings
      }
      if (type !== undefined) singleClass.adminUpdates.type = type;
      if (joinTime !== undefined)
        singleClass.adminUpdates.joinTime = new Date(joinTime);
      if (penalty !== undefined) singleClass.adminUpdates.penalty = penalty;

      await singleClass.save();
      await teacher.save();

      res.status(200).json({
        message: "Class updated successfully by admin.",
        class: singleClass,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error updating class/session by admin.",
      error: error.message,
    });
  }
};


// Admin resolves a dispute for a class or session
exports.resolveDisputeForClassOrSession = async (req, res) => {
  const { classId, sessionId, remarks } = req.body;
  const adminId = req.user._id; // Assuming admin ID comes from auth middleware

  // Validate required fields
  if (!remarks) {
    return res.status(400).json({ message: "Resolution remarks are required." });
  }

  try {
    if (sessionId) {
      // Resolve dispute for a session
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found." });
      }

      // Check if dispute exists
      if (!session.dispute || !session.dispute.reason) {
        return res.status(400).json({ message: "No dispute exists for this session." });
      }

      // Check if already resolved
      if (session.dispute.isResolved) {
        return res.status(400).json({ message: "Dispute is already resolved." });
      }

      // Resolve the dispute
      session.dispute.isResolved = true;
      session.dispute.remarks = remarks;
      // You might want to add resolvedAt timestamp here if needed

      await session.save();

      res.status(200).json({
        message: "Session dispute resolved successfully.",
        session
      });
    } else {
      // Resolve dispute for a class
      const singleClass = await Class.findById(classId);
      if (!singleClass) {
        return res.status(404).json({ message: "Class not found." });
      }

      // Check if dispute exists
      if (!singleClass.dispute || !singleClass.dispute.reason) {
        return res.status(400).json({ message: "No dispute exists for this class." });
      }

      // Check if already resolved
      if (singleClass.dispute.isResolved) {
        return res.status(400).json({ message: "Dispute is already resolved." });
      }

      // Resolve the dispute
      singleClass.dispute.isResolved = true;
      singleClass.dispute.remarks = remarks;
      // You might want to add resolvedAt timestamp here if needed

      await singleClass.save();

      res.status(200).json({
        message: "Class dispute resolved successfully.",
        class: singleClass
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error resolving dispute for class/session.",
      error: error.message
    });
  }
};

// Update admin profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.params.id; // Get _id from URL
    const {
      adminId: newAdminId,
      name,
      email,
      age,
      sex,
      profileImage,
    } = req.body;

    console.log("Updating admin with _id:", adminId);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: "Invalid admin ID." });
    }

    // Find and update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        ...(newAdminId && { adminId: newAdminId }), // Only update if provided
        ...(name && { name }),
        ...(email && { email }),
        ...(age && { age }),
        ...(sex && { sex }),
        ...(profileImage && { profileImage }),
      },
      { new: true } // Return updated document
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json({
      message: "Admin profile updated successfully.",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Error updating admin profile:", error.message);
    res
      .status(500)
      .json({ message: "Error updating admin profile.", error: error.message });
  }
};

// Update teacher profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.params.id; // Get _id from URL
    const {
      teacherId: newTeacherId,
      name,
      email,
      age,
      sex,
      timezone,
      profileImage,
    } = req.body;

    console.log("Updating teacher with _id:", teacherId);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "Invalid teacher ID." });
    }

    // Find and update teacher
    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        ...(newTeacherId && { teacherId: newTeacherId }),
        ...(name && { name }),
        ...(email && { email }),
        ...(age && { age }),
        ...(sex && { sex }),
        ...(timezone && { timezone }),
        ...(profileImage && { profileImage }),
      },
      { new: true } // Return updated document
    )
      .populate("coursesTaught") // Populate the coursesTaught field
      .exec();

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    res.status(200).json({
      message: "Teacher profile updated successfully.",
      teacher: updatedTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error.message);
    res.status(500).json({
      message: "Error updating teacher profile.",
      error: error.message,
    });
  }
};

// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id; // Get _id from URL
    const {
      studentId: newStudentId,
      name,
      email,
      age,
      sex,
      parentName,
      timezone,
      profileImage,
      courseEnrolled, // Expecting an array of course objects to add/update
    } = req.body;

    console.log("Updating student with _id:", studentId);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Update basic fields if provided
    if (newStudentId) student.studentId = newStudentId;
    if (name) student.name = name;
    if (email) student.email = email;
    if (age) student.age = age;
    if (sex) student.sex = sex;
    if (parentName) student.parentName = parentName;
    if (timezone) student.timezone = timezone;
    if (profileImage) student.profileImage = profileImage;

    // Update courseEnrolled if provided
    if (courseEnrolled && Array.isArray(courseEnrolled)) {
      // Loop through the provided courses and add/update them
      courseEnrolled.forEach((newCourse) => {
        const existingCourseIndex = student.courseEnrolled.findIndex(
          (course) => course._id.toString() === newCourse._id
        );

        if (existingCourseIndex !== -1) {
          // Update existing course
          student.courseEnrolled[existingCourseIndex] = newCourse;
        } else {
          // Add new course
          student.courseEnrolled.push(newCourse);
        }
      });
    }

    await student.save();

    // Save the updated student
    const updatedStudent = await Student.findById(studentId).populate(
      "courseEnrolled"
    );

    res.status(200).json({
      message: "Student profile updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error.message);
    res.status(500).json({
      message: "Error updating student profile.",
      error: error.message,
    });
  }
};

// Delete admin profile
exports.deleteAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid admin ID." });
    }

    // Find and delete the admin profile
    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json({ message: "Admin profile deleted successfully." });
  } catch (error) {
    console.error("Error deleting admin profile:", error.message);
    res
      .status(500)
      .json({ message: "Error deleting admin profile.", error: error.message });
  }
};

// Create a new resource
exports.createResource = async (req, res) => {
  try {
    const { title, courseId, visualAid, lessonPlan, studentIds } = req.body;

    // Validate required fields
    if (!title || !courseId || !visualAid || !lessonPlan) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Validate student IDs if provided
    if (
      studentIds &&
      !studentIds.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res
        .status(400)
        .json({ message: "Invalid student ID(s) provided." });
    }

    // Create new resource
    const newResource = new Resource({
      title,
      course: courseId,
      visualAid,
      lessonPlan,
      studentIds: studentIds || [],
    });

    await newResource.save();
    await course.save();

    res.status(201).json({
      message: "Resource created successfully",
      resource: newResource,
    });
  } catch (error) {
    console.error("Error creating resource:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Edit a resource
exports.editResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, courseId, visualAid, lessonPlan, studentIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid resource ID." });
    }

    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID." });
    }

    if (
      studentIds &&
      !studentIds.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      return res
        .status(400)
        .json({ message: "Invalid student ID(s) provided." });
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      id,
      { title, course: courseId, visualAid, lessonPlan, studentIds },
      { new: true, runValidators: true }
    );

    if (!updatedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.status(200).json({
      message: "Resource updated successfully",
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Error updating resource:", error);
    res
      .status(500)
      .json({ message: "Error updating resource.", error: error.message });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid resource ID." });
    }

    const deletedResource = await Resource.findByIdAndDelete(id);

    if (!deletedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    res
      .status(500)
      .json({ message: "Error deleting resource.", error: error.message });
  }
};

// Create a new homework
exports.createHomework = async (req, res) => {
  try {
    // Extract data from the request body
    const { title, description, homeworkLink, course, studentIds, type } =
      req.body;

    // Validate required fields
    if (!title || !description || !course) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and course are required fields.",
      });
    }

    // Get the admin ID from the authenticated user (attached by the middleware)
    const createdBy = req.user._id;

    // Create a new homework document
    const newHomework = new Homework({
      title,
      description,
      homeworkLink,
      course,
      studentIds: studentIds || [], // Default to an empty array if not provided
      createdBy, // Set the admin who created the homework
      type,
    });

    // Save the homework to the database
    const savedHomework = await newHomework.save();

    // Send a success response with the created homework
    res.status(201).json({
      success: true,
      message: "Homework created successfully.",
      data: savedHomework,
    });
  } catch (error) {
    // Handle errors
    console.error("Error creating homework:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the homework.",
      error: error.message,
    });
  }
};

// Edit existing homework
exports.editHomework = async (req, res) => {
  try {
    const { id } = req.params; // Get _id from URL
    const {
      title,
      description,
      course,
      teacherId,
      classId,
      homeworkLink,
      studentIds,
      dueDate,
      attachments,
      type,
    } = req.body;

    console.log("Updating homework with _id:", id);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid homework ID." });
    }

    // Create update object with only provided fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (course) updateData.course = course;
    if (teacherId) {
      updateData.teacherId = teacherId;
      updateData.teacher = teacherId; // Ensure both fields are updated
    }
    if (classId) updateData.classId = classId;
    if (homeworkLink) updateData.homeworkLink = homeworkLink;
    if (studentIds) updateData.studentIds = studentIds;
    if (dueDate) updateData.dueDate = dueDate;
    if (attachments) updateData.attachments = attachments;
    if (type) updateData.type = type;

    // Find and update the homework
    const updatedHomework = await Homework.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedHomework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    res.status(200).json({
      message: "Homework updated successfully",
      homework: updatedHomework,
    });
  } catch (error) {
    console.error("Error updating homework:", error.message);
    res
      .status(500)
      .json({ message: "Error updating homework.", error: error.message });
  }
};
// Delete homework
exports.deleteHomework = async (req, res) => {
  try {
    const { id } = req.params; // Get _id from URL

    console.log("Deleting homework with _id:", id);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid homework ID." });
    }

    // Find and delete the homework
    const deletedHomework = await Homework.findByIdAndDelete(id);

    if (!deletedHomework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    res.status(200).json({ message: "Homework deleted successfully" });
  } catch (error) {
    console.error("Error deleting homework:", error.message);
    res
      .status(500)
      .json({ message: "Error deleting homework.", error: error.message });
  }
};

// Create a new payment record
exports.createPayment = async (req, res) => {
  try {
    const { userId, userType, date, receiptImage } = req.body;

    // Validate required fields
    if (!userId || !userType || !date || !receiptImage) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate userType (must be either "Student" or "Teacher")
    if (!["Student", "Teacher"].includes(userType)) {
      return res.status(400).json({ message: "Invalid userType" });
    }

    const newPayment = new Payment({
      userId,
      userType,
      date,
      receiptImage,
    });

    await newPayment.save();

    res.status(201).json({
      message: "Payment record created successfully",
      payment: newPayment,
    });
  } catch (error) {
    console.error("Error creating payment record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an existing payment record
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params; // Get _id from URL
    const { teacherId, date, receiptImage } = req.body;

    console.log("Updating payment record with _id:", id);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment record ID." });
    }

    // Find and update the payment record
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      { teacherId, date, receiptImage },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.status(200).json({
      message: "Payment record updated successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error updating payment record:", error.message);
    res.status(500).json({
      message: "Error updating payment record.",
      error: error.message,
    });
  }
};

// Delete a payment record
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params; // Get _id from URL

    console.log("Deleting payment record with _id:", id);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid payment record ID." });
    }

    // Find and delete the payment record
    const deletedPayment = await Payment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    res.status(200).json({ message: "Payment record deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment record:", error.message);
    res.status(500).json({
      message: "Error deleting payment record.",
      error: error.message,
    });
  }
};

// Create a class recording
exports.createClassRecording = async (req, res) => {
  const { title, userId, userType, classDate, videoLink, course } = req.body;

  // Validate input
  if (!title || !userId || !userType || !classDate || !videoLink || !course) {
    return res.status(400).json({
      message:
        "All fields are required: title, userId, userType, classDate, videoLink.",
    });
  }

  // Validate userType
  if (!["Teacher", "Student"].includes(userType)) {
    return res.status(400).json({
      message: "Invalid userType. Must be either 'Teacher' or 'Student'.",
    });
  }

  try {
    // Create the class recording
    const newRecording = new Recording({
      title,
      userId,
      userType,
      classDate,
      videoLink,
      course,
      createdBy: req.user._id, // Assuming the authenticated user is an Admin and their ID is available in req.user
    });

    await newRecording.save();
    res.status(201).json({
      message: "Class recording created successfully.",
      recording: newRecording,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating class recording.",
      error: error.message,
    });
  }
};

// Update a class recording
exports.updateClassRecording = async (req, res) => {
  try {
    const { id } = req.params; // Get _id from URL
    const updates = req.body; // Fields to update

    console.log("Updating class recording with _id:", id);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class recording ID." });
    }

    // Find and update recording
    const updatedRecording = await ClassRecording.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    );

    if (!updatedRecording) {
      return res.status(404).json({ message: "Class recording not found." });
    }

    res.status(200).json({
      message: "Class recording updated successfully.",
      recording: updatedRecording,
    });
  } catch (error) {
    console.error("Error updating class recording:", error.message);
    res.status(500).json({
      message: "Error updating class recording.",
      error: error.message,
    });
  }
};

// Delete a class recording
exports.deleteClassRecording = async (req, res) => {
  try {
    const { id } = req.params; // Get _id from URL

    console.log("Deleting class recording with _id:", id);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid class recording ID." });
    }

    // Find and delete recording
    const deletedRecording = await Recording.findByIdAndDelete(id);

    if (!deletedRecording) {
      return res.status(404).json({ message: "Class recording not found." });
    }

    res.status(200).json({ message: "Class recording deleted successfully." });
  } catch (error) {
    console.error("Error deleting class recording:", error.message);
    res.status(500).json({
      message: "Error deleting class recording.",
      error: error.message,
    });
  }
};

//create announcement
exports.createAnnouncement = async (req, res) => {
  const { image, link } = req.body;

  // Validate base64 image
  if (!validateBase64Image(image)) {
    return res.status(400).json({
      success: false,
      message: "Invalid base64 image format.",
    });
  }

  try {
    const newAnnouncement = new Announcement({
      image,
      link: link || null,
      createdBy: req.user._id, // Admin ID from authenticated admin
    });

    await newAnnouncement.save();
    res.status(201).json({
      success: true,
      message: "Announcement created successfully.",
      announcement: newAnnouncement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating announcement.",
      error: error.message,
    });
  }
};

// Get announcements created by the authenticated admin
exports.getAnnouncementsByAdmin = async (req, res) => {
  try {
    // Fetch announcements created by the authenticated admin
    const announcements = await Announcement.find({
      createdBy: req.user._id,
    }).sort({ createdAt: -1 }); // Sort by most recent first

    res.status(200).json({
      success: true,
      message: "Announcements retrieved successfully.",
      announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving announcements.",
      error: error.message,
    });
  }
};

// Get all announcements (public route)
exports.getAllAnnouncements = async (req, res) => {
  try {
    // Fetch all announcements and sort by most recent first
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email"); // Optional: Populate admin details

    res.status(200).json({
      success: true,
      message: "All announcements retrieved successfully.",
      announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving announcements.",
      error: error.message,
    });
  }
};

//update announcement
exports.updateAnnouncement = async (req, res) => {
  const { announcementId } = req.params;
  const { image } = req.body;

  // Validate base64 image
  if (image && !validateBase64Image(image)) {
    return res.status(400).json({
      success: false,
      message: "Invalid base64 image format.",
    });
  }

  try {
    const announcement = await Announcement.findById(announcementId);

    // Check if the announcement exists and belongs to the authenticated admin
    if (
      !announcement ||
      announcement.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found or unauthorized.",
      });
    }

    // Update the announcement
    announcement.image = image || announcement.image;
    await announcement.save();

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully.",
      announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating announcement.",
      error: error.message,
    });
  }
};

//delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    // Check if the announcement exists and belongs to the authenticated admin
    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found or unauthorized.",
      });
    }

    const announcement = await Announcement.findByIdAndDelete(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting announcement.",
      error: error.message,
    });
  }
};
