const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  }, // Reference to Class schema
  startDateTime: { type: Date, required: true }, // Start date/time of the session
  endDateTime: { type: Date, required: true }, // End date/time of the session
  isRescheduled: { type: Boolean, default: false }, // Flag to track if the session has been rescheduled
  rescheduledDateTime: { type: Date }, // New date/time for rescheduled sessions
  topicsTaught: { type: String }, // Topics taught in the session (filled by the teacher)
  classType: { // Type of class (filled by the teacher)
    type: String,
    enum: ["regular", "student_absent", "ptm", "test"],
  },
  adminUpdates: { // Updates by the admin
    amount: { type: Number, default: 0 }, // Amount for the session
    type: { // Type of session (filled by the admin)
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
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
