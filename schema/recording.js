const mongoose = require("mongoose");

const classRecordingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "userType", // Dynamic reference to either 'Teacher' or 'Student'
  },
  userType: {
    type: String,
    enum: ["Teacher", "Student"], // Differentiates between Teacher & Student
    required: true,
  },
  classDate: {
    type: Date,
    required: true,
  },
  videoLink: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    // required: true,
  },
});

module.exports = mongoose.model("ClassRecording", classRecordingSchema);
