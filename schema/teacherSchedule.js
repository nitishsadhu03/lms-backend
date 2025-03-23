const mongoose = require("mongoose");

// Schema for managing teacher's schedule (actual class assignments)
const teacherScheduleSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    // required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    // required: true,
  },
  date: {
    type: Date,
    // required: true,
  },
  startTime: {
    type: String,
    // required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"],
  },
  endTime: {
    type: String,
    // required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"],
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled", "rescheduled"],
    default: "scheduled",
  },
  // Add this field to track recurring sessions
  recurringSessionId: {
    type: String,
    index: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  schedule: [
    {
      day: {
        type: String,
        enum: [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        // required: true,
      },
      startTime: {
        type: String, // Format: "HH:mm" (24-hour format)
        // required: true,
      },
      endTime: {
        type: String, // Format: "HH:mm" (24-hour format)
        // required: true,
      },
    },
  ]
});

// Compound indexes for efficient querying
teacherScheduleSchema.index({ teacherId: 1, date: 1 });
teacherScheduleSchema.index({ classId: 1, date: 1 });

// Update timestamps on save
teacherScheduleSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("TeacherSchedule", teacherScheduleSchema);