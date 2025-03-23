const express = require('express');
const router = express.Router();
const { rescheduleClass } = require('../controllers/studentController');
const { getCertificates } = require('../controllers/teacherController');
const authMiddleware = require('../middlewares/authMiddleware'); // Ensure token verification

router.put('/reschedule/:classId', authMiddleware.authenticateStudent, rescheduleClass);

// Route to fetch certificates for a student
// router.get('/certificates', authMiddleware.studentCheck, getCertificates);

module.exports = router;
