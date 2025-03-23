// const express = require("express");
// const { markClassCompleted, generateCertificate } = require("../controllers/completionController");
// const { validateCompletion } = require("../middlewares/validationMiddleware");
// const router = express.Router();

// router.post("/classes/:classId/complete", validateCompletion, markClassCompleted);
// router.post("/courses/:courseId/certificate", validateCompletion, generateCertificate);

// module.exports = router;



const express = require('express');
const router = express.Router();
const {
  assignHomework,
  checkCertificateEligibility
} = require('../controllers/completionController');
const { teacherCheck, authenticateStudent1 } = require('../middlewares/authMiddleware');

// Homework routes - using your teacherCheck middleware
// router.post('/homework/:classId', teacherCheck, assignHomework);

// Certificate routes - using your authenticateStudent middleware
router.get('/certificate-eligibility/:courseId', authenticateStudent1, checkCertificateEligibility);


module.exports = router;