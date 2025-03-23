const mongoose = require("mongoose");

const completionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  homeworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "homeworkSchema",
    required: true,
  },
  completionDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["completed", "incomplete"],
    default: "completed",
  }
});

completionSchema.index({ studentId: 1, classId: 1 });

module.exports = mongoose.model("Completion", completionSchema);
