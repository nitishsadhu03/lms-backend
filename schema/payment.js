const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "userType", // Dynamic reference to either 'Teacher' or 'Student'
  },
  userType: {
    type: String,
    enum: ["Teacher", "Student"], // Differentiates between Teacher & Student
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  receiptImage: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Payment", paymentSchema);
