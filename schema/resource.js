const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  visualAid: {
    type: String,
    required: true,
    match: [/^https?:\/\/[\w-]+(\.[\w-]+)+[/#?]?.*$/, 'Invalid URL format'],
  },
  lessonPlan: {
    type: String,
    required: true,
    match: [/^https?:\/\/[\w-]+(\.[\w-]+)+[/#?]?.*$/, 'Invalid URL format'],
  },
  studentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ]
});

module.exports = mongoose.model('Resource', resourceSchema);
