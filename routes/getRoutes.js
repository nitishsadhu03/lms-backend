const express = require("express");
const router = express.Router();
const {
  authenticateAdmin,
  authenticateStudent,
  authenticateTeacher,
  authenticateTeacher1  
} = require("../middlewares/authMiddleware");
const {
  getProfile,
  getAllUsersByRole,
  getAllCourses,
  getAllResources,
  getAllClassesForAdmin,
  getAllHomeworksForAdmin,
  getAdminPayments,
  getClassRecordings,
  getEnrolledCourses,
  getCourseResources,
  getStudentClasses,
  getStudentHomework,
  getStudentPayments,
  issueCertificate,
  getTeacherClasses,
  getTeacherAssignedClasses,
  getTeacherPayments,
  getTeacherHomework,
  getAllHomework,
  getAllClasses,
  getStudentRecordings,
  getTeacherRecordings,
} = require("../controllers/getRequest");

// Route to get all courses created by the admin
router.get("/courses", getAllCourses);

// Route to get all resources:-
router.get("/resources", getAllResources);

// Router to get all homework:-
router.get("/all-homework", getAllHomework)

router.get("/all-classes", getAllClasses);

// Route to get all classes (for a particular admin only i.e. all classes created by that admin)
router.get("/classes/admin",authenticateAdmin, getAllClassesForAdmin);

// teacher get to see his assigned classes
router.get("/classes/teacher", authenticateTeacher, getTeacherClasses);

/// student get to see his assigned classes.
router.get("/classes/student", authenticateStudent, getStudentClasses);

// Get all homeworks for a logged-in admin (teacher)
router.get("/homeworks", authenticateAdmin, getAllHomeworksForAdmin);

// Not DOne YET
// router.get("/profile", teacherCheck, getTeacherProfile);

// Get all payments for a particular admin
router.get("/payments", authenticateAdmin, getAdminPayments);

// get all class recordings for a particular admin
router.get("/class-recordings", authenticateAdmin, getClassRecordings);

// get all the course enrolled to the student(Student access only)
router.get("/courses/enrolled", authenticateStudent, getEnrolledCourses);

// get all resources for a specific course (Student access only)
router.get("/course/:courseId/resources", authenticateStudent, getCourseResources);

// // get all classes for a student
// router.get("/student/classes", authenticateStudent, getStudentClasses);

// get all the homework assigned to the student.
router.get("/homework", authenticateStudent, getStudentHomework);

// get payment assigned to the student by the admin
router.get("/student/payments", authenticateStudent, getStudentPayments);

// get recordings assigned to the student by the admin
router.get("/student/recordings", authenticateStudent, getStudentRecordings);

//get classes assigned to the teacher:-
router.get("/teacher/classes", authenticateTeacher1, getTeacherClasses);


// get payment assigned to the teacher:-
router.get("/teacher/payments", authenticateTeacher1, getTeacherPayments);

// get recordings assigned to the teacher:-
router.get("/teacher/recordings", authenticateTeacher1, getTeacherRecordings);

// get homework assigned by the teacher
router.get("/teacher/homework", authenticateTeacher1, getTeacherHomework);


// get the certificate issued to the student by the admin:-
router.post("/issue", authenticateAdmin, issueCertificate);

// Route to get profile based on user ID and role
router.get("/:role/:id", getProfile);

// Route to get all users by role
router.get("/:role", getAllUsersByRole);


module.exports = router;
