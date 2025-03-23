const mongoose = require("mongoose");

const loginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true,
  },
  forgotPasswordToken: {
    type: String, // Token for password reset
  },
  forgotPasswordExpires: {
    type: Date, // Expiration time for the token
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function () {
      return this.role === 'student' || this.role === 'teacher' ||  this.role === 'admin';
    },
    refPath: 'role',
  },  
});

module.exports = mongoose.model('Login', loginSchema);
