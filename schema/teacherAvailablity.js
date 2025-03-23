
const mongoose = require("mongoose");

// Schema for managing teacher's availability slots
const teacherAvailabilitySchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  availableTimeSlots: [{
    startTime: {
      type: String,
      required: true,
      // Format: "HH:mm" (24-hour format)
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"],
      validate: {
        validator: function(value) {
          // Convert times to minutes for comparison
          const startMinutes = this.startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
          const endMinutes = value.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
          return endMinutes > startMinutes;
        },
        message: "End time must be after start time"
      }
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "reserved"],
      default: "active"
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Compound index for efficient querying
teacherAvailabilitySchema.index({ teacherId: 1 });

// Update timestamps on save
teacherAvailabilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


module.exports = mongoose.model("TeacherAvailability", teacherAvailabilitySchema);