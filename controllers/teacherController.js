// const Homework = require('../schema/homework'); 
// const Teacher = require('../schema/teacher');
// const Student = require('../schema/student'); 
// const jwt=require('jsonwebtoken')
// const JWT_SECRET = process.env.JWT_SECRET;
// // Controller for assigning homework to a student
// exports.assignHomework = async (req, res) => {
//     try {
//       // Get the token from the authorization header
//       const token = req.headers.authorization?.split(' ')[1];
//       if (!token) {
//         return res.status(401).json({ message: "Authorization token is required." });
//       }
  
//       // Decode the token to get the teacher's details
//       const decoded = jwt.verify(token, JWT_SECRET);
//       const { id, roleId } = decoded; // This is the teacher's ID (roleId)
  
//       // Validate if the decoded role is 'teacher'
//       if (decoded.role !== 'teacher') {
//         return res.status(403).json({ message: "You are not authorized to assign homework." });
//       }
  
//       // Fetch teacher profile using the roleId
//       const teacher = await Teacher.findById(roleId);
//       if (!teacher) {
//         return res.status(404).json({ message: "Teacher not found." });
//       }
  
//       // Get homework data from the request
//       const { title, description, homeworkLink, studentId } = req.body;
      
//       // Ensure all fields are present
//       if (!title || !description || !homeworkLink || !studentId) {
//         return res.status(400).json({ message: "All fields are required." });
//       }
  
//       // Create the homework document
//       const homework = new Homework({
//         title,
//         description,
//         homeworkLink,
//         teacher: teacher._id, // Set the teacher's _id
//       });
  
//       // Assign the student to the homework (assuming studentId is correct)
//       homework.studentIds = [studentId]; // Assuming studentId exists in the request body
  
//       // Save homework to database
//       await homework.save();
  
//       res.status(200).json({ message: "Homework assigned successfully.", homework });
//     } catch (error) {
//       res.status(500).json({ message: "Error assigning homework.", error: error.message });
//     }
//   };


const Homework = require('../schema/homework');
const Teacher = require('../schema/teacher');
const Student = require('../schema/student');
const Resource = require("../schema/resource");
const Certificate = require('../schema/certificate');
const Course = require('../schema/course')
const Class = require('../schema/class');
const Session = require('../schema/session');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); // To validate ObjectId
const JWT_SECRET = process.env.JWT_SECRET;

// exports.assignHomework = async (req, res) => {
//   try {
//     // 1. Get the token from the Authorization header
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ message: "Authorization token is required." });
//     }

//     // 2. Decode the token
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET); // Use environment variable for JWT_SECRET
//     } catch (error) {
//       return res.status(401).json({ message: "Invalid or expired token." });
//     }

//     const { id, roleId, role } = decoded;

//     // 3. Validate that the user is a teacher
//     if (role !== 'teacher') {
//       return res.status(403).json({ message: "You are not authorized to assign homework." });
//     }

//     // 4. Fetch the teacher profile using roleId
//     const teacher = await Teacher.findById(roleId);
//     if (!teacher) {
//       return res.status(404).json({ message: "Teacher not found." });
//     }

//     // 5. Get the homework data from the request body
//     const { 
//       homeworkId, // ID of the existing homework
//       studentIds = [], // Array of student IDs to add
//     } = req.body;

//     // 6. Validate required fields
//     if (!homeworkId || !studentIds || !Array.isArray(studentIds)) {
//       return res.status(400).json({ 
//         message: "Required fields missing: homeworkId and studentIds (array) are required." 
//       });
//     }

//     // 7. Validate the homeworkId
//     if (!mongoose.Types.ObjectId.isValid(homeworkId)) {
//       return res.status(400).json({ message: "Invalid homework ID format." });
//     }

//     // 8. Find the existing homework
//     const homework = await Homework.findById(homeworkId);
//     if (!homework) {
//       return res.status(404).json({ message: "Homework not found." });
//     }

//     // 9. Validate each studentId in the array
//     for (const studentId of studentIds) {
//       if (!mongoose.Types.ObjectId.isValid(studentId)) {
//         return res.status(400).json({ message: `Invalid student ID format: ${studentId}` });
//       }

//       // 10. Validate the student exists in the database
//       const student = await Student.findById(studentId);
//       if (!student) {
//         return res.status(404).json({ message: `Student not found with ID: ${studentId}` });
//       }

//       // 11. Check if the student is already assigned to the homework
//       if (homework.studentIds.includes(studentId)) {
//         return res.status(400).json({ message: `Student with ID ${studentId} is already assigned to this homework.` });
//       }
//     }

//     // 12. Add the new studentIds to the existing homework
//     homework.studentIds = [...homework.studentIds, ...studentIds];

//     // 13. Save the updated homework document to the database
//     await homework.save();

//     // 14. Respond with success
//     res.status(200).json({
//       message: "Students added to homework successfully.",
//       homework,
//     });
//   } catch (error) {
//     // 15. Handle unexpected errors
//     console.error(error);
//     res.status(500).json({
//       message: "Error assigning students to homework.",
//       error: error.message,
//     });
//   }
// };

exports.assignHomework = async (req, res) => {
  try {
    // 1. Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    // 2. Decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { id, roleId, role } = decoded;

    // 3. Validate that the user is a teacher
    if (role !== 'teacher') {
      return res.status(403).json({ message: "You are not authorized to assign homework." });
    }

    // 4. Fetch the teacher profile using roleId
    const teacher = await Teacher.findById(roleId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // 5. Get the homework data from the request body
    const { 
      homeworkId, // ID of the existing homework
      studentIds = [], // Array of student IDs to add
    } = req.body;

    // 6. Validate required fields
    if (!homeworkId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        message: "Required fields missing: homeworkId and studentIds (array) are required." 
      });
    }

    // 7. Validate the homeworkId
    if (!mongoose.Types.ObjectId.isValid(homeworkId)) {
      return res.status(400).json({ message: "Invalid homework ID format." });
    }

    // 8. Find the existing homework
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ message: "Homework not found." });
    }

    // 9. Validate each studentId in the array
    for (const studentId of studentIds) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: `Invalid student ID format: ${studentId}` });
      }

      // 10. Validate the student exists in the database
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: `Student not found with ID: ${studentId}` });
      }

      // 11. Check if the student is already assigned to the homework
      if (homework.studentIds.includes(studentId)) {
        return res.status(400).json({ message: `Student with ID ${studentId} is already assigned to this homework.` });
      }
    }

    // 12. Add the new studentIds to the existing homework
    homework.studentIds = [...homework.studentIds, ...studentIds];

    // 13. Save the updated homework document to the database
    await homework.save();

    // 14. Certificate Logic (Added after homework.save())
    // for (const studentId of studentIds) {
    //   const student = await Student.findById(studentId);
    //   if (!student) continue; // Skip if student not found

    //   // Fetch the course details for the homework
    //   const courseDetails = await Course.findById(homework.course);
    //   if (!courseDetails) {
    //     console.error(`Course not found for homework: ${homework._id}`);
    //     continue; // Skip if course not found
    //   }

    //   // Count the number of homework assignments for this student in this course
    //   const homeworkCount = await Homework.countDocuments({
    //     course: homework.course,
    //     studentIds: { $in: [studentId] }
    //   });

    //   // Calculate the percentage of completed sessions
    //   const totalSessions = courseDetails.numberOfSessions;
    //   const completionPercentage = (homeworkCount / totalSessions) * 100;

    //   // If 80% of sessions are completed, issue a certificate
    //   if (completionPercentage >= 80) {
    //     const certificateNumber = `CERT-${Date.now()}-${studentId}`;

    //     const certificate = new Certificate({
    //       studentId,
    //       courseId: homework.course,
    //       certificateNumber,
    //       completionPercentage,
    //     });

    //     await certificate.save();

    //     // Update the student's certificates array
    //     student.certificates.push({
    //       courseId: homework.course,
    //       certificateUrl: `https://example.com/certificates/${certificateNumber}`, // Replace with actual URL logic
    //       issuedAt: Date.now(),
    //       isEligible: true,
    //     });

    //     await student.save();
    //   }
    // }

    // 15. Respond with success
    res.status(200).json({
      message: "Students added to homework successfully.",
      homework,
    });
  } catch (error) {
    // 16. Handle unexpected errors
    console.error(error);
    res.status(500).json({
      message: "Error assigning students to homework.",
      error: error.message,
    });
  }
};

// Function to fetch certificates for a student
exports.getCertificates = async (req, res) => {
  try {
    // 1. Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    // 2. Decode the token to get the student's ID
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const { id, roleId, role } = decoded;

    // 3. Validate that the user is a student
    if (role !== 'student') {
      return res.status(403).json({ message: "You are not authorized to view certificates." });
    }

    // 4. Fetch the student's details
    const student = await Student.findById(roleId).populate('certificates.courseId', 'name');
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // 5. Return the certificates
    res.status(200).json({
      message: "Certificates fetched successfully.",
      certificates: student.certificates,
    });
  } catch (error) {
    // 6. Handle unexpected errors
    console.error(error);
    res.status(500).json({
      message: "Error fetching certificates.",
      error: error.message,
    });
  }
};

exports.assignResource = async (req, res) => {
  try {
    // Get the token from the authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authorization token is required." });
    }

    // Decode the token to get the teacher's details
    const decoded = jwt.verify(token, JWT_SECRET);
    const { roleId, role } = decoded; // `roleId` is the teacher's ID

    // Validate the role
    if (role !== "teacher") {
      return res.status(403).json({ message: "You are not authorized to assign resources." });
    }

    // Fetch teacher profile using the roleId
    const teacher = await Teacher.findById(roleId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Get resource data from the request
    const { title, course, link, studentIds } = req.body;

    // Validate required fields
    if (!title || !course || !link || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        message: "All fields (title, course, link, and studentIds) are required.",
      });
    }

    // Validate the course ID
    if (!mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ message: "Invalid course ID format." });
    }

    // Validate each student ID
    const validStudentIds = [];
    for (const id of studentIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: `Invalid student ID format: ${id}` });
      }
      const studentExists = await Student.findById(id);
      if (!studentExists) {
        return res.status(404).json({ message: `Student not found: ${id}` });
      }
      validStudentIds.push(id);
    }

    // Create the resource document
    const resource = new Resource({
      title,
      course,
      link,
      studentIds: validStudentIds, // Add student IDs here
    });

    // Save resource to the database
    await resource.save();

    res.status(200).json({ message: "Resource assigned successfully.", resource });
  } catch (error) {
    res.status(500).json({ message: "Error assigning resource.", error: error.message });
  }
};

// Teacher updates a class or session
exports.updateClassOrSessionByTeacher = async (req, res) => {
  const { classId, sessionId, topicsTaught, classType } = req.body;

  try {
    if (sessionId) {
      // Update a session (for recurring classes)
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found." });
      }

      // Only update fields that are provided
      if (topicsTaught !== undefined) session.topicsTaught = topicsTaught;
      if (classType !== undefined) session.classType = classType;

      await session.save();

      res.status(200).json({
        message: "Session updated successfully by teacher.",
        session,
      });
    } else {
      // Update a single class
      const singleClass = await Class.findById(classId);
      if (!singleClass) {
        return res.status(404).json({ message: "Class not found." });
      }

      // Only update fields that are provided
      if (topicsTaught !== undefined) singleClass.topicsTaught = topicsTaught;
      if (classType !== undefined) singleClass.classType = classType;

      await singleClass.save();

      res.status(200).json({
        message: "Class updated successfully by teacher.",
        class: singleClass,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error updating class/session by teacher.",
      error: error.message,
    });
  }
};
