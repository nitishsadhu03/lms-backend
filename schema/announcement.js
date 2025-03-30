const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    validate: {
      validator: (value) => {
        const regex = /^data:image\/(png|jpeg|jpg|gif);base64,/;
        return regex.test(value);
      },
      message: "Invalid base64 image format.",
    },
  },
  link: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Announcement", announcementSchema);
