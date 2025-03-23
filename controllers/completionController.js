// const Homework=require('../schema/homeworkSchema')
const Certificate=require('../schema/certificate')
const ClassCompletion=require('../schema/completion')
const Class = require('../schema/class');
const crypto = require('crypto');

// Homework Controllers
exports.assignHomework = async (req, res) => {
  try {
    const classId = req.params.classId; // Get classId from URL params instead of body
    const { title, description, dueDate, attachments } = req.body;
    const teacherId = req.user.roleId;

    // Verify if the class exists and belongs to the teacher
    const classExists = await Class.findOne({ 
      _id: classId, 
      teacherId: teacherId.toString() // Ensure type consistency
    });

    if (!classExists) {
      return res.status(404).json({ success: false, message: "Class not found or unauthorized" });
    }

    const homework = new Homework({
      classId,
      teacherId,
      title,
      description,
      dueDate,
      attachments
    });

    await homework.save();

    // Mark class as completed for all students in the class
    const students = classExists.students;
    await Promise.all(students.map(async (studentId) => {
      await ClassCompletion.create({
        studentId,
        classId,
        homeworkId: homework._id
      });
    }));

    res.status(201).json({ 
      success: true, 
      data: homework,
      message: "Homework assigned and class marked as completed"
    });
  } catch (error) {
    console.error('Error in assignHomework:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};


// Class Completion and Certificate Controllers
exports.checkCertificateEligibility = async (req, res) => {
  try {
    const studentId = req.student._id; // From authenticateStudent middleware
    const { classId } = req.params;

    // First verify the class exists
    const classDetails = await Class.findById(classId);

    if (!classDetails) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Check if student is in the students array
    if (!classDetails.students.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: "Student not enrolled in this class"
      });
    }

    // Get all homework assignments for this class
    const homeworkAssignments = await Homework.find({ classId });
    const totalHomework = homeworkAssignments.length;

    if (totalHomework === 0) {
      return res.status(200).json({
        success: true,
        message: "No homework assignments found for this class",
        completionStats: {
          totalHomework: 0,
          completedHomework: 0,
          completionPercentage: 0
        }
      });
    }

    // Get completed homework for this student
    const completions = await Completion.find({
      studentId,
      classId,
      status: "completed"
    }).populate('homeworkId', 'title description dueDate');

    const completedHomework = completions.length;
    const completionPercentage = ((completedHomework / totalHomework) * 100).toFixed(2);

    // Check if eligible for certificate (80% completion)
    const isEligible = completionPercentage >= 80;

    const response = {
      success: true,
      eligible: isEligible,
      class: {
        batchId: classDetails.batchId,
        isRecurring: classDetails.isRecurring,
        duration: classDetails.duration
      },
      completionStats: {
        totalHomework,
        completedHomework,
        completionPercentage: parseFloat(completionPercentage),
        remaining: isEligible ? 0 : Math.ceil((0.8 * totalHomework) - completedHomework)
      },
      homeworkDetails: homeworkAssignments.map(hw => ({
        title: hw.title,
        dueDate: hw.dueDate,
        completed: completions.some(c => c.homeworkId?._id.toString() === hw._id.toString())
      }))
    };

    if (isEligible) {
      // Check if certificate already exists
      let certificate = await Certificate.findOne({ 
        studentId, 
        classId,
        status: "issued"
      });
      
      if (!certificate) {
        certificate = await Certificate.create({
          studentId,
          classId,
          certificateNumber: `CERT-${Date.now()}-${studentId.toString().slice(-4)}`,
          completionPercentage: parseFloat(completionPercentage),
          issueDate: new Date()
        });
      }
      
      response.certificate = certificate;
    } else {
      response.message = `Complete ${response.completionStats.remaining} more homework assignments to be eligible for certificate`;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in checkCertificateEligibility:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Error checking certificate eligibility",
      error: error.message 
    });
  }
};

// Helper function to generate unique certificate number
function generateCertificateNumber() {
  return `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}
