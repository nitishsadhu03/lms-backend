const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 20,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
  },
  sex: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  parentName: {
    type: String,
    trim: true,
  },
  courseEnrolled: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  // completedClasses: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Class",
  //   },
  // ],
  // certificate: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Certificate",
  // },
  completedCourses: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      completedClasses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
        },
      ],
    },
  ],
  certificates: [
    {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
      },
      certificateUrl: { type: String, required: true },
      issuedAt: { type: Date, default: Date.now },
      isEligible: {
        type: Boolean,
        default: false,
      },
    },
  ],
  timezone: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: "default-profile.png",
  },
});

module.exports = mongoose.model("Student", studentSchema);
