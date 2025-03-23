const express = require('express');
const router = express.Router();
const {
  setAvailability,
  getAvailability,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  getTeacherSchedule,
  assignClass,
  getAllTeachersTimetables,
  getAllTeachersAvailabilities,
  createTeacherSchedule,
  getAllTeacherSchedules,
  getScheduleById,
  deleteTeacherSchedule,
  rescheduleClass
} = require('../controllers/teacherAvailablityController');
const {
  authenticateUser,
  verifyTeacher,
  authenticateAdmin,
  teacherCheck,
  authenticateTeacher
} = require('../middlewares/authMiddleware');

// Teacher availability routes
router.post(
  '/availability',
  authenticateUser,
  verifyTeacher,
  setAvailability
);

router.get(
  '/availability/:teacherId',
  authenticateUser,
  verifyTeacher,
  getAvailability
);

router.get("/availabilities/all", authenticateAdmin, getAllTeachersAvailabilities);

router.put(
  '/availability/:slotId',
  authenticateUser,
  verifyTeacher,
  updateAvailabilitySlot
);

router.delete(
  '/availability/:slotId',
  authenticateUser,
  verifyTeacher,
  deleteAvailabilitySlot
);

// Teacher schedule routes
router.get(
  '/schedule/:teacherId?',
  authenticateUser,
  getTeacherSchedule
);

// Admin routes for class assignment
router.post(
  '/assign-class',
  authenticateUser,
  authenticateAdmin,
  assignClass
);

// Admin route to get all teachers' timetables
router.get(
  '/all-timetables',
  authenticateUser,
  authenticateAdmin,
  getAllTeachersTimetables
);

// Admin route to reschedule a class
router.put(
  '/reschedule/:scheduleId',
  authenticateUser,
  authenticateAdmin,
  rescheduleClass
);

// Teacher creates/updates their weekly schedule
router.post("/weekly-schedule", authenticateUser, verifyTeacher, createTeacherSchedule);

// Get logged in teacher's schedule
router.get(
  '/my-schedule',
  authenticateUser,
  verifyTeacher,
  getTeacherSchedule
);

// Get all teacher schedules (admin only)
router.get(
  '/all',
  authenticateUser,
  authenticateAdmin,
  getAllTeacherSchedules
);

// Get specific teacher's schedule by ID
router.get(
  '/:teacherId',
  authenticateUser,
  getScheduleById
);

// Delete teacher schedule
router.delete(
  '/my-schedule',
  authenticateUser,
  verifyTeacher,
  deleteTeacherSchedule
);


module.exports = router;