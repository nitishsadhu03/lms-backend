const mongoose = require("mongoose");
const TeacherScheduleSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
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
        required: true,
      },
      startTime: {
        type: String, // Format: "HH:mm" (24-hour format)
        required: true,
      },
      endTime: {
        type: String, // Format: "HH:mm" (24-hour format)
        required: true,
      },
    },
  ],
});
module.exports = mongoose.model("TeacherSchedule", TeacherScheduleSchema);