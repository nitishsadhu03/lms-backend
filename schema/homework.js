const mongoose = require("mongoose");

// Simplified Homework Schema
const homeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  homeworkLink: {
    type: String,
    match: [/^https?:\/\/.+$/, "Invalid URL format for homework link"],
  },
  // Course reference
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  // Students assigned to this homework
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  }],
  // Admin who created the homework
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    // required: true,
  },
  // Creation timestamp (keeping this as it's useful)
  createdAt: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ["Classwork", "Homework"],
    // required: true,
  }
});

// Index for performance on course lookups
homeworkSchema.index({ course: 1 });

module.exports = mongoose.model('Homework', homeworkSchema);