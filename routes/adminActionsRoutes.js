const express = require("express");
const router = express.Router();
const adminActionsController = require("../controllers/adminActionsController");
const {
  createCourse,
  updateAdminProfile,
  deleteAdminProfile,
  createClass,
  deleteClass,
  rescheduleClass,
  createClassRecording,
  updateClassRecording,
  deleteClassRecording,
  createResource,
  editResource,
  deleteResource,
  createHomework,
  editHomework,
  deleteHomework,
  createPayment,
  updatePayment,
  deletePayment,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  updateClassOrSessionByAdmin
} = require("../controllers/adminActionsController");
const { authenticateAdmin } = require("../middlewares/authMiddleware");

// Admin creates a new Student
router.post("/create-student", adminActionsController.createStudent);

// Admin creates a new Teacher
router.post("/create-teacher", adminActionsController.createTeacher);

// Admin creates another Admin --> DONE
router.post("/create-admin", adminActionsController.createAdmin);

// --------------- DONE ----------------


// Route to create a course
router.post("/create-course", authenticateAdmin, createCourse);

// Create a new class - Only accessible by admin
router.post("/create-class", authenticateAdmin, createClass);

// Delete a class - Only accessible by admin
router.delete("/delete-class/:id", authenticateAdmin, deleteClass);

// Class rescheduling routes
// router.put("/classes/reschedule/:classId/:sessionNumber", authenticateAdmin, rescheduleClass);

// Reschedule a single class or a session in a recurring class - Only accessible by admin
router.put("/classes/reschedule", authenticateAdmin, adminActionsController.rescheduleClassOrSession);


// Route to update class details, including adding students or modifying other fields
router.put(
  "/update-class/:id",
  authenticateAdmin,
  adminActionsController.updateClass
);

// Route to update admin profile
router.put("/update-profile/:id", authenticateAdmin, updateAdminProfile);

// Update teacher profile
router.put("/teacher/:id", adminActionsController.updateTeacherProfile);

// Update student profile
router.put("/student/:id", adminActionsController.updateStudentProfile);

// Route to delete admin profile
router.delete("/delete-profile/:id", authenticateAdmin, deleteAdminProfile);

// Route to create a new resource - Only accessible by admin
router.post("/create-resource", authenticateAdmin, createResource);

// Route to edit an existing resource - Only accessible by admin
router.put("/edit-resource/:id", authenticateAdmin, editResource);

// Route to delete a resource - Only accessible by admin
router.delete("/delete-resource/:id", authenticateAdmin, deleteResource);

// Route to create homework (Admin only)
router.post("/create-homework", authenticateAdmin, createHomework);

// Route to edit homework (Admin only)
router.put("/edit-homework/:id", authenticateAdmin, editHomework);

// Route to delete homework (Admin only)
router.delete("/delete-homework/:id", authenticateAdmin, deleteHomework);

// Route to create a new payment record (Admin only)
router.post("/create-payment", authenticateAdmin, createPayment);

// Route to update a payment record (Admin only)
router.put("/update-payment/:id", authenticateAdmin, updatePayment);

// Route to delete a payment record (Admin only)
router.delete("/delete-payment/:id", authenticateAdmin, deletePayment);

// Route to create a class recording
router.post("/class-recording", authenticateAdmin, createClassRecording);

// Route to update a class recording
router.put("/class-recording/:id", authenticateAdmin, updateClassRecording);

// Route to delete a class recording
router.delete("/class-recording/:id", authenticateAdmin, deleteClassRecording);

// Route to create a announcement
router.post("/announcement", authenticateAdmin, createAnnouncement);

// Route to get announcements created by the authenticated admin
router.get("/announcements", authenticateAdmin, adminActionsController.getAnnouncementsByAdmin);

// Public route to get all announcements
router.get("/all-announcements", adminActionsController.getAllAnnouncements);

// Update Announcement
router.put("/update-announcement/:announcementId", authenticateAdmin, updateAnnouncement);

// Delete Announcement
router.delete("/delete-announcement/:announcementId", authenticateAdmin, deleteAnnouncement);

// Admin updates a class or session
router.post("/update-by-admin", authenticateAdmin, updateClassOrSessionByAdmin);


module.exports = router;
