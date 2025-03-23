const express = require('express');
const router = express.Router();
const { assignHomework } = require('../controllers/teacherController');
const authMiddleware = require('../middlewares/authMiddleware'); 
const { assignResource } = require("../controllers/teacherController");
const { getCertificates } = require('../controllers/teacherController');
const { updateClassOrSessionByTeacher } = require('../controllers/teacherController');

// Route to assign homework to student
// router.post('/assign-homework', authMiddleware.teacherCheck, assignHomework);

// Route to assign homework to student
router.post('/assign-homework', authMiddleware.teacherCheck, assignHomework);

// Route to assign resources:-
router.post("/assign-resource", assignResource);

router.get('/certificates', authMiddleware.studentCheck, getCertificates);

// Teacher updates a class or session
router.post("/update-by-teacher", authMiddleware.teacherCheck, updateClassOrSessionByTeacher);

module.exports = router;
