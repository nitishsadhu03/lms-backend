const Student = require("../schema/student");
const Teacher = require("../schema/teacher");
const Admin = require("../schema/admin");
const Course = require("../schema/course");
const Resource = require("../schema/resource");
const Class = require("../schema/class");
const Homework = require("../schema/homework");
const jwt = require("jsonwebtoken");
const Payment = require("../schema/payment");
const Certificate = require("../schema/certificate");
const ClassRecording = require("../schema/recording");
const Announcement = require("../schema/announcement");

// Controller to get profile based on user ID and role
exports.getProfile = async (req, res) => {
  try {
    // Extract the role and ID from the request parameters or body
    const { id, role } = req.params; // or req.body if sent in the request body

    if (!id || !role) {
      return res
        .status(400)
        .json({ message: "Both 'id' and 'role' are required." });
    }

    // Validate the role
    if (!["student", "teacher", "admin"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    let profile;

    // Fetch the profile based on the role
    if (role.toLowerCase() === "student") {
      profile = await Student.findById(id).populate(
        "courseEnrolled",
        "name numberOfSessions"
      ); // Populating courses for better info
    } else if (role.toLowerCase() === "teacher") {
      profile = await Teacher.findById(id);
    } else if (role.toLowerCase() === "admin") {
      profile = await Admin.findById(id);
    }

    // Check if the profile exists
    if (!profile) {
      return res
        .status(404)
        .json({
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found.`,
        });
    }

    // Return the profile
    res
      .status(200)
      .json({ message: "Profile retrieved successfully.", profile });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving profile.", error: error.message });
  }
};

// controller in which i can get the profile without specifying any particular role:-
exports.getAllUsersByRole = async (req, res) => {
  try {
    // Extract the role from the request parameters
    const { role } = req.params;

    if (!role) {
      return res.status(400).json({ message: "Role parameter is required." });
    }

    // Validate the role
    if (!["student", "teacher", "admin"].includes(role.toLowerCase())) {
      return res
        .status(400)
        .json({
          message:
            "Invalid role provided. Valid roles are 'student', 'teacher', and 'admin'.",
        });
    }

    let users;

    // Fetch all users based on the role
    if (role.toLowerCase() === "student") {
      users = await Student.find().populate(
        "courseEnrolled",
        "name numberOfSessions"
      );
      // users = await Student.find();
    } else if (role.toLowerCase() === "teacher") {
      users = await Teacher.find().populate(
        "coursesTaught",
        "name numberOfSessions"
      );
    } else if (role.toLowerCase() === "admin") {
      users = await Admin.find();
    }

    // Check if any users were found
    if (!users || users.length === 0) {
      return res.status(404).json({ message: `No ${role}s found.` });
    }

    // Return the list of users
    res.status(200).json({
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      }s retrieved successfully.`,
      users,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving users.", error: error.message });
  }
};

// Get all courses (created by the admin)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find(); // Fetch all courses

    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No courses found." });
    }

    res
      .status(200)
      .json({ message: "Courses retrieved successfully.", courses });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving courses.", error: error.message });
  }
};

// Get all resources
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find().populate("course");

    if (!resources || resources.length === 0) {
      return res.status(404).json({ message: "No resources found." });
    }

    res
      .status(200)
      .json({ message: "Resources retrieved successfully.", resources });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving resources.", error: error.message });
  }
};

// Get All homework without any authentication
exports.getAllHomework = async (req, res) => {
  try {
    // Find all homeworks in the database
    const homeworks = await Homework.find()
      .populate("course", "name numberOfSessions") // Populate course details (optional)
      .populate("studentIds", "name email") // Populate student details (optional)
      .populate("createdBy", "name email") // Populate admin details (optional)
      .exec();

    // Send the response with the list of all homeworks
    res.status(200).json({
      success: true,
      message: "All homeworks fetched successfully.",
      data: homeworks,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching all homeworks:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching all homeworks.",
      error: error.message,
    });
  }
};

// get the classes for admin itself.
exports.getAllClassesForAdmin = async (req, res) => {
  try {
    const { startDate, endDate, teacherId, status, isRecurring } = req.query;

    // Get the admin ID from the authenticated admin
    const adminId = req.user._id;

    // Build filter object
    const filter = { adminId }; // Only fetch classes for this admin

    // Add date filters
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }, // For recurring classes
        {
          startDateTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }, // For single classes
      ];
    }

    // Add other filters
    if (teacherId) filter.teacherId = teacherId;
    if (status) filter.status = status;
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === "true";

    // Fetch classes with populate
    const classes = await Class.find(filter)
      .populate("teacherId", "name email")
      .populate("studentIds", "name email")
      .populate("sessions") // Populate sessions for recurring classes
      .populate("courseId")
      .sort({ createdAt: -1 });

    // Process classes to include startDate and endDate for single-use classes
    const processedClasses = classes.map((cls) => {
      const classObj = cls.toObject();

      // Add startDate and endDate for single classes
      if (!classObj.isRecurring) {
        classObj.startDate = classObj.startDateTime;
        classObj.endDate = classObj.endDateTime;
      }

      // Add repeatDays and repeatDates for recurring classes
      if (classObj.isRecurring) {
        classObj.repeatDays = classObj.repeatDays || [];
        classObj.repeatDates = classObj.repeatDates || [];
      }

      return classObj;
    });

    // Calculate stats
    const stats = {
      totalClasses: processedClasses.length,
      recurringClasses: processedClasses.filter((c) => c.isRecurring).length,
      oneTimeClasses: processedClasses.filter((c) => !c.isRecurring).length,
      totalStudents: [
        ...new Set(
          processedClasses.flatMap((c) =>
            c.studentIds.map((s) => s._id.toString())
          )
        ),
      ].length,
    };

    // Send response
    res.status(200).json({
      message: "Classes retrieved successfully",
      stats,
      classes: processedClasses,
    });
  } catch (error) {
    console.error("Error in getAllClassesForAdmin:", error);
    res
      .status(500)
      .json({ message: "Error fetching classes", error: error.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const { startDate, endDate, teacherId, status, isRecurring } = req.query;

    // Build filter object
    const filter = {};

    // Add date filters
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }, // For recurring classes
        {
          startDateTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }, // For single classes
      ];
    }

    // Add other filters
    if (teacherId) filter.teacherId = teacherId;
    if (status) filter.status = status;
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === "true";

    // Fetch classes with populate
    const classes = await Class.find(filter)
      .populate("teacherId", "name email")
      .populate("studentIds", "name email")
      .populate("sessions") // Populate sessions for recurring classes
      .populate("courseId")
      .sort({ createdAt: -1 });

    // Process classes to include startDate and endDate for single-use classes
    const processedClasses = classes.map((cls) => {
      const classObj = cls.toObject();

      // Add startDate and endDate for single classes
      if (!classObj.isRecurring) {
        classObj.startDate = classObj.startDateTime;
        classObj.endDate = classObj.endDateTime;
      }

      // Add repeatDays and repeatDates for recurring classes
      if (classObj.isRecurring) {
        classObj.repeatDays = classObj.repeatDays || [];
        classObj.repeatDates = classObj.repeatDates || [];
      }

      return classObj;
    });

    // Calculate stats
    const stats = {
      totalClasses: processedClasses.length,
      recurringClasses: processedClasses.filter((c) => c.isRecurring).length,
      oneTimeClasses: processedClasses.filter((c) => !c.isRecurring).length,
      totalStudents: [
        ...new Set(
          processedClasses.flatMap((c) =>
            c.studentIds.map((s) => s._id.toString())
          )
        ),
      ].length,
    };

    // Send response
    res.status(200).json({
      message: "Classes retrieved successfully",
      stats,
      classes: processedClasses,
    });
  } catch (error) {
    console.error("Error in getAllClasses:", error);
    res
      .status(500)
      .json({ message: "Error fetching classes", error: error.message });
  }
};

// teacher get to see assigned class.
exports.getTeacherClasses = async (req, res) => {
  try {
    const { startDate, endDate, status, isRecurring } = req.query;

    // Build filter object
    const filter = { teacherId: req.teacher._id };

    // Add date filters
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }, // For recurring classes
        {
          startDateTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }, // For single classes
      ];
    }

    // Add other filters
    if (status) filter.status = status;
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === "true";

    // Fetch classes with populate
    const classes = await Class.find(filter)
      .populate("studentIds", "name email")
      .populate("sessions") // Populate sessions for recurring classes
      .populate("courseId")
      .sort({ createdAt: -1 });

    // Process classes to include startDate and endDate for single-use classes
    const processedClasses = classes.map((cls) => {
      const classObj = cls.toObject();

      // Add startDate and endDate for single classes
      if (!classObj.isRecurring) {
        classObj.startDate = classObj.startDateTime;
        classObj.endDate = classObj.endDateTime;
      }

      // Add repeatDays and repeatDates for recurring classes
      if (classObj.isRecurring) {
        classObj.repeatDays = classObj.repeatDays || [];
        classObj.repeatDates = classObj.repeatDates || [];
      }

      return classObj;
    });

    // Calculate stats
    const stats = {
      totalClasses: processedClasses.length,
      recurringClasses: processedClasses.filter((c) => c.isRecurring).length,
      oneTimeClasses: processedClasses.filter((c) => !c.isRecurring).length,
      totalStudents: [
        ...new Set(
          processedClasses.flatMap((c) =>
            c.studentIds.map((s) => s._id.toString())
          )
        ),
      ].length,
    };

    // Send response
    res.status(200).json({
      message: "Classes retrieved successfully",
      stats,
      classes: processedClasses,
    });
  } catch (error) {
    console.error("Error in getTeacherClasses:", error);
    res
      .status(500)
      .json({ message: "Error fetching classes", error: error.message });
  }
};

// student get to see assigned class.(updated)
exports.getStudentClasses = async (req, res) => {
  try {
    const { startDate, endDate, status, isRecurring } = req.query;

    // Build filter object
    const filter = { studentIds: req.student._id };

    // Add date filters
    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }, // For recurring classes
        {
          startDateTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }, // For single classes
      ];
    }

    // Add other filters
    if (status) filter.status = status;
    if (isRecurring !== undefined) filter.isRecurring = isRecurring === "true";

    // Fetch classes with populate
    const classes = await Class.find(filter)
      .populate("teacherId", "name email")
      .populate("sessions") // Populate sessions for recurring classes
      .populate("courseId")
      .sort({ createdAt: -1 });

    // Process classes to include startDate and endDate for single-use classes
    const processedClasses = classes.map((cls) => {
      const classObj = cls.toObject();

      // Add startDate and endDate for single classes
      if (!classObj.isRecurring) {
        classObj.startDate = classObj.startDateTime;
        classObj.endDate = classObj.endDateTime;
      }

      // Add repeatDays and repeatDates for recurring classes
      if (classObj.isRecurring) {
        classObj.repeatDays = classObj.repeatDays || [];
        classObj.repeatDates = classObj.repeatDates || [];
      }

      return classObj;
    });

    // Calculate stats
    const stats = {
      totalClasses: processedClasses.length,
      recurringClasses: processedClasses.filter((c) => c.isRecurring).length,
      oneTimeClasses: processedClasses.filter((c) => !c.isRecurring).length,
      upcomingClasses: processedClasses.filter(
        (c) => c.nextSessionDate && new Date(c.nextSessionDate) > new Date()
      ).length,
    };

    // Send response
    res.status(200).json({
      message: "Classes retrieved successfully",
      stats,
      classes: processedClasses,
    });
  } catch (error) {
    console.error("Error in getStudentClasses:", error);
    res
      .status(500)
      .json({ message: "Error fetching classes", error: error.message });
  }
};

// get all homeworks by the admin:-
exports.getAllHomeworksForAdmin = async (req, res) => {
  try {
    // Get the admin ID from the authenticated user (attached by the middleware)
    const adminId = req.user._id;

    // Find all homework created by this admin
    const homeworks = await Homework.find({ createdBy: adminId })
      .populate("course", "name numberOfSessions") // Populate course details (optional)
      .populate("studentIds", "name email") // Populate student details (optional)
      .exec();

    // Send the response with the list of homeworks
    res.status(200).json({
      success: true,
      message: "Homework fetched successfully.",
      data: homeworks,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching homework:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching homework.",
      error: error.message,
    });
  }
};

// Get all class recordings for a particular admin
exports.getClassRecordings = async (req, res) => {
  try {
    const adminId = req.user.id; // Extract admin ID from authenticated user

    // Fetch all class recordings created by this admin
    const recordings = await ClassRecording.find({ createdBy: adminId })
      .populate({
        path: "userId",
        select: "name email", // Select fields to populate
        options: { strictPopulate: false }, // Allow dynamic population
      })
      .populate("course", "name numberOfSessions")
      .sort({ classDate: -1 }); // Sort by most recent class

    res.status(200).json({
      success: true,
      message: "Class recordings retrieved successfully.",
      recordings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving class recordings.",
      error: error.message,
    });
  }
};

//Get Teacher Recordings
exports.getTeacherRecordings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Ensure teacher is authenticated
    if (!req.teacher || !req.teacher._id) {
      return res.status(401).json({
        success: false,
        message: "Teacher authentication required.",
      });
    }

    // Build filter object
    const filter = {
      userId: req.teacher._id,
      userType: "Teacher", // Explicitly specify userType to match schema
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      filter.classDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch recordings for the teacher
    const recordings = await ClassRecording.find(filter)
      .sort({ classDate: -1 }) // Sort by most recent class
      .populate("userId", "name email")
      .populate("course", "name numberOfSessions"); // Populate teacher details

    // Calculate stats (optional)
    const stats = {
      totalRecordings: recordings.length,
      upcomingRecordings: recordings.filter(
        (recording) => new Date(recording.classDate) > new Date()
      ).length,
      pastRecordings: recordings.filter(
        (recording) => new Date(recording.classDate) <= new Date()
      ).length,
    };

    res.status(200).json({
      success: true,
      message: "Teacher recordings retrieved successfully.",
      stats,
      recordings,
    });
  } catch (error) {
    console.error("Error in getTeacherRecordings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching teacher recordings.",
      error: error.message,
    });
  }
};

//Get Student Recordings
exports.getStudentRecordings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Ensure student is authenticated
    if (!req.student || !req.student._id) {
      return res.status(401).json({
        success: false,
        message: "Student authentication required.",
      });
    }

    // Build filter object
    const filter = {
      userId: req.student._id,
      userType: "Student", // Explicitly specify userType to match schema
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      filter.classDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Fetch recordings for the student
    const recordings = await ClassRecording.find(filter)
      .sort({ classDate: -1 }) // Sort by most recent class
      .populate("userId", "name email")
      .populate("course", "name numberOfSessions"); // Populate student details

    // Calculate stats (optional)
    const stats = {
      totalRecordings: recordings.length,
      upcomingRecordings: recordings.filter(
        (recording) => new Date(recording.classDate) > new Date()
      ).length,
      pastRecordings: recordings.filter(
        (recording) => new Date(recording.classDate) <= new Date()
      ).length,
    };

    res.status(200).json({
      success: true,
      message: "Student recordings retrieved successfully.",
      stats,
      recordings,
    });
  } catch (error) {
    console.error("Error in getStudentRecordings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching student recordings.",
      error: error.message,
    });
  }
};

// ----------------------- STUDENT --------------------------
// Get courses enrolled by the authenticated student
exports.getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.studentId; // Extract student ID from token

    // Find student and use the correct field from your schema
    const student = await Student.findById(studentId).populate(
      "completedCourses.courseId",
      "name numberOfSessions"
    );

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found." });
    }

    // Extract course information from the correct schema structure
    const courses = student.completedCourses.map((item) => ({
      _id: item.courseId._id,
      name: item.courseId.name,
      numberOfSessions: item.courseId.numberOfSessions,
      completedClasses: item.completedClasses,
    }));

    res.status(200).json({
      success: true,
      message: "Enrolled courses retrieved successfully.",
      courses: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving enrolled courses.",
      error: error.message,
    });
  }
};

// Get all resources for a particular course (for the authenticated student)
exports.getCourseResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.studentId; // Extracted from authenticated token

    // Make sure to properly import your Resource model
    const Resource = require("../schema/resource"); // Adjust the path as needed

    // Fetch resources for the given course that include the authenticated student
    const resources = await Resource.find({
      course: courseId,
      studentIds: studentId,
    });

    res.status(200).json({
      success: true,
      message: "Resources fetched successfully.",
      data: resources,
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching resources.",
      error: error.message,
    });
  }
};

// get all the homework issued by the admin to the student
exports.getStudentHomework = async (req, res) => {
  try {
    const studentId = req.studentId; // Extracted from authenticated student token

    // Find all homework where the student is assigned
    const homeworkList = await Homework.find({ studentIds: studentId })
      .populate("course", "name numberOfSessions") // Populate course details // Populate class details
      .select("title description homeworkLink course createdAt type");

    if (!homeworkList.length) {
      return res.status(404).json({ message: "No homework assigned yet." });
    }

    res.status(200).json({
      message: "Homework retrieved successfully",
      homework: homeworkList,
    });
  } catch (error) {
    console.error("Error fetching student homework:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.getTeacherAssignedClasses = async (req, res) => {
  try {
    const { startDate, endDate, status, isRecurring } = req.query;

    // Build filter object using teacher's roleId from token
    const filter = {
      teacherId: req.teacher._id,
    };

    // Add date filters if provided
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Add recurring filter if provided
    if (isRecurring !== undefined) {
      filter.isRecurring = isRecurring === "true";
    }

    const classes = await Class.find(filter)
      .populate("students", "name email")
      .sort({ createdAt: -1 });

    // Calculate some useful statistics
    const stats = {
      totalClasses: classes.length,
      activeClasses: classes.filter((c) => c.status === "active").length,
      recurringClasses: classes.filter((c) => c.isRecurring).length,
      totalStudents: [
        ...new Set(
          classes.flatMap((c) => c.students.map((s) => s._id.toString()))
        ),
      ].length,
      upcomingClasses: classes.filter((c) => {
        if (c.isRecurring && c.recurrencePattern.startDate) {
          return new Date(c.recurrencePattern.startDate) > new Date();
        }
        return false;
      }).length,
    };

    // Format the response to include relevant class details
    const formattedClasses = classes.map((c) => ({
      _id: c._id,
      batchId: c.batchId,
      classLink: c.classLink,
      status: c.status,
      isRecurring: c.isRecurring,
      students: c.students,
      schedule: c.isRecurring
        ? {
            type: c.recurrencePattern.type,
            days: c.recurrencePattern.repeatDays,
            startDate: c.recurrencePattern.startDate,
            endDate: c.recurrencePattern.endDate,
            duration: c.duration,
            totalSessions: c.totalSessions,
          }
        : null,
    }));

    res.status(200).json({
      message: "Classes retrieved successfully",
      stats,
      classes: formattedClasses,
    });
  } catch (error) {
    console.error("Error in getTeacherClasses:", error);
    res.status(500).json({
      message: "Error fetching classes",
      error: error.message,
    });
  }
};

// Get teacher's homework with filtering options
exports.getTeacherHomework = async (req, res) => {
  try {
    const { startDate, endDate, status, classId } = req.query;

    // Build filter object
    const filter = {
      teacherId: req.teacher._id,
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      filter.status = status; // e.g., 'pending', 'graded'
    }

    if (classId) {
      filter.classId = classId;
    }

    const homework = await Homework.find(filter)
      .populate("classId", "title batchId")
      .populate("studentIds", "name email")
      .populate("course", "title")
      .sort({ dueDate: -1 });

    // Calculate statistics for the teacher
    const stats = {
      totalHomework: homework.length,
      pendingGrading:
        homework.filter((h) => h.status === "pending").length || 0,
      gradedHomework: homework.filter((h) => h.status === "graded").length || 0,
      upcomingDeadlines: homework.filter(
        (h) => h.dueDate && new Date(h.dueDate) > new Date()
      ).length,
    };

    res.status(200).json({
      message: "Homework retrieved successfully",
      stats,
      homework,
    });
  } catch (error) {
    console.error("Error in getTeacherHomework:", error);
    res.status(500).json({
      message: "Error fetching homework",
      error: error.message,
    });
  }
};

// Teacher payment
exports.getTeacherPayments = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Build filter object - Important change here
    const filter = {
      userId: req.teacher._id,
      userType: "Teacher", // Explicitly specify userType to match schema
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      filter.status = status; // e.g., 'pending', 'paid', 'failed'
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      pendingPayments: payments.filter((p) => p.status === "pending").length,
      completedPayments: payments.filter((p) => p.status === "paid").length,
    };

    res.status(200).json({
      message: "Payments retrieved successfully",
      stats,
      payments,
    });
  } catch (error) {
    console.error("Error in getTeacherPayments:", error);
    res.status(500).json({
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// Student payment
exports.getStudentPayments = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Ensure student is authenticated
    if (!req.student || !req.student._id) {
      return res.status(401).json({
        success: false,
        message: "Student authentication required.",
      });
    }

    // Build filter object
    const filter = {
      userId: req.student._id,
      userType: "Student",
    };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      filter.status = status;
    }

    // Find all payments assigned to this student
    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    // Calculate stats (similar to teacher payments)
    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ),
      pendingPayments: payments.filter((p) => p.status === "pending").length,
      completedPayments: payments.filter((p) => p.status === "paid").length,
    };

    res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      stats,
      payments,
    });
  } catch (error) {
    console.error("Error fetching student payments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// admin payment
exports.getAdminPayments = async (req, res) => {
  try {
    // Ensure admin is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    const { startDate, endDate, status, userType, userId } = req.query;

    // Build filter object with optional filters
    const filter = {};

    if (userType) {
      filter.userType = userType;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (status) {
      filter.status = status;
    }

    // Fetch payments with dynamic population based on userType
    const payments = await Payment.find(filter)
      .populate({
        path: "userId",
        select: "name email",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payments.",
      error: error.message,
    });
  }
};

// Function to generate a unique identifier for each certificate
const generateCertificateID = () => {
  return (
    "CERT-" +
    Date.now() +
    "-" +
    Math.random().toString(36).substr(2, 9).toUpperCase()
  );
};

// Function to sign the certificate data
const signCertificate = (data) => {
  return jwt.sign(data, process.env.CERTIFICATE_SECRET, { expiresIn: "10y" });
};

// Issue a certificate to a student
exports.issueCertificate = async (req, res) => {
  try {
    const { studentId, courseId, grade } = req.body;

    // Check if the requester is an authenticated admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate input data
    if (!studentId || !courseId || !grade) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    // Check if student and course exist
    const student = await User.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Generate unique certificate ID
    const certificateID = generateCertificateID();

    // Create certificate data
    const certificateData = {
      certificateID,
      studentId: student._id,
      courseId: course._id,
      studentName: student.name,
      courseName: course.name,
      grade,
      issuedBy: req.user._id,
      issuedAt: new Date(),
    };

    // Sign the certificate for authenticity
    const signature = signCertificate(certificateData);

    // Save the certificate in the database
    const newCertificate = new Certificate({
      ...certificateData,
      signature,
    });
    await newCertificate.save();

    return res
      .status(201)
      .json({ message: "Certificate issued successfully", certificateID });
  } catch (error) {
    console.error("Error issuing certificate:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
