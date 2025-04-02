// const mongoose = require("mongoose");

// // Enhanced Class Schema
// const classSchema = new mongoose.Schema({
//   batchId: {
//     type: String,
//     // required: true
//   },
//   teacherId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Teacher",
//     required: true,
//   },
//   students: [
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Student",
//     },
//   ],
//   classLink: {
//     type: String,
//     required: true,
//     match: [/^https?:\/\/[\w-]+(\.[\w-]+)+[/#?]?.*$/, "Invalid URL format"],
//   },
//   isRecurring: {
//     type: Boolean,
//     default: false,
//   },
//   recurrencePattern: {
//     type: {
//       type: String,
//       enum: ["weekly", "monthly"],
//       required: function () {
//         return this.isRecurring;
//       },
//     },
//     repeatDays: [
//       {
//         type: String,
//         enum: [
//           "Sunday",
//           "Monday",
//           "Tuesday",
//           "Wednesday",
//           "Thursday",
//           "Friday",
//           "Saturday",
//         ],
//       },
//     ],
//     startDate: {
//       type: Date,
//       required: function () {
//         return this.isRecurring;
//       },
//       validate: {
//         validator: function (value) {
//           return value >= new Date();
//         },
//         message: "Start date must not be in the past",
//       },
//     },
//     endDate: {
//       type: Date,
//       // required: function () {
//       //   return this.isRecurring;
//       // },
//       // validate: {
//       //   validator: function (value) {
//       //     return this.startDate && value > this.startDate;
//       //   },
//       //   message: "End date must be after start date",
//       // },
//     },
//   },
//   customRescheduleDates: [
//     {
//       sessionNumber: { type: Number, required: true },
//       newDate: { type: Date, required: true },
//     },
//   ],
//   duration: {
//     type: Number, // in minutes
//     // required: true,
//     min: 1,
//   },
//   totalSessions: {
//     type: Number,
//     default: 1,
//     min: 1,
//     validate: {
//       validator: function (value) {
//         return !this.isRecurring || value > 1;
//       },
//       message: "Recurring classes must have more than one session",
//     },
//   },
//   status: {
//     type: String,
//     enum: ["active", "completed", "cancelled"],
//     default: "active",
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
//   startTime: {
//     type: Date,
//     required: function () {
//       return !this.isRecurring;
//     },
//   },
//   endTime: {
//     type: Date,
//     // required: function () {
//     //   return !this.isRecurring;
//     // },
//   },
//   nextSessionDate: {
//     type: Date,
//   },
//   adminId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Admin",
//   required: true,
// },
// });

// classSchema.index({ batchId: 1 });
// classSchema.index({ teacherId: 1 });

// // Update timestamps
// classSchema.pre("save", function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model("Class", classSchema);

const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  batchId: { type: String, required: true }, // Batch ID as a string
  classLink: { type: String, required: true }, // Class link (e.g., Zoom URL)
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  }, // Reference to Teacher schema
  studentIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  ], // Array of Student IDs
  isRecurring: { type: Boolean, default: false }, // Flag to identify recurring classes
  startDate: { type: Date }, // Start date for recurring classes
  startDateTime: { type: Date }, // For single classes
  endDateTime: { type: Date }, // For single classes
  repeatType: { type: String, enum: ["weekly", "monthly"] }, // For recurring classes
  repeatDays: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      startTime: { type: String }, // e.g., "14:00"
      endTime: { type: String }, // e.g., "15:00"
    },
  ], // For weekly recurring classes
  repeatDates: [
    {
      date: { type: Number, min: 1, max: 31 }, // e.g., 1 (for the 1st of the month)
      startTime: { type: String }, // e.g., "14:00"
      endTime: { type: String }, // e.g., "15:00"
    },
  ], // For monthly recurring classes
  numberOfSessions: { type: Number }, // For recurring classes
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }], // Array of session IDs for recurring classes
  isRescheduled: { type: Boolean, default: false }, // Flag to track if the class has been rescheduled
  originalStartDateTime: { type: Date }, // Original start date/time for single classes
  originalEndDateTime: { type: Date }, // Original end date/time for single classes
  createdAt: { type: Date, default: Date.now },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  }, // Admin who created the class

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    // required: true,
  },

  // New fields for single classes
  topicsTaught: { type: String }, // Topics taught in the class (filled by the teacher)
  classType: { // Type of class (filled by the teacher)
    type: String,
    enum: ["regular", "student_absent", "ptm", "test"],
  },
  adminUpdates: { // Updates by the admin
    amount: { type: Number, default: 0 }, // Amount for the class
    type: { // Type of class (filled by the admin)
      type: String,
      enum: ["paid", "cancelled", "rescheduled", "unsuccessful"],
    },
    joinTime: { type: Date }, // Join time of the teacher (filled by the admin)
    penalty: { // Penalty dropdown (filled by the admin)
      type: String,
      enum: [
        "No show",
        "Video Duration (<40min)",
        "Cancellation (<120min)",
        "1-7 class cancellation",
        "No",
        "Class Duration (<55min)",
        "Delayed Partial",
        "Delayed Full",
        "Summary not filled",
      ],
    },
  },
  dispute: {
    reason: { type: String }, // Reason for dispute (filled by teacher)
    status: { 
      type: String,
      enum: ["pending", "resolved", "rejected"],
    }, 
    remarks: { type: String }, // Admin's remarks when resolving
  },
});

module.exports = mongoose.model("Class", classSchema);
