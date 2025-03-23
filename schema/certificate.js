const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  certificateNumber: {
    type: String,
    unique: true,
    // required: true,
  },
  completionPercentage: {
    type: Number,
    // required: true,
  },
  status: {
    type: String,
    enum: ["issued", "revoked"],
    default: "issued",
  }
});

certificateSchema.index({ studentId: 1, courseId: 1 });


module.exports = mongoose.model("Certificate", certificateSchema);
