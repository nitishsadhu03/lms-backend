const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  adminId: {
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
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 65,
  },
  sex: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  profileImage: {
    type: String,
    default: 'default-profile.png',
  },
});

module.exports = mongoose.model('Admin', adminSchema);
