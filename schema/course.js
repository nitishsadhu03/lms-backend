const mongoose = require("mongoose");
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  numberOfSessions: {
    type: Number,
    required: true,
    min: [1, "A course must have at least 1 session."],
  }  
});

module.exports = mongoose.model("Course", courseSchema);
