const mongoose=require('mongoose')

const batchSchema = new mongoose.Schema({
  batchId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true 
  },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Teacher", 
    required: true 
  },
  students: [{
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Student" 
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
    status: {
      type: String,
      enum: ["active", "dropped", "completed"],
      default: "active"
    }
  }],
  totalSessions: { 
    type: Number, 
    required: true,
    min: 1 
  },
  completedSessions: {
    type: Number,
    default: 0,
    validate: {
      validator: function(value) {
        return value <= this.totalSessions;
      },
      message: "Completed sessions cannot exceed total sessions"
    }
  },
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});


batchSchema.index({ batchId: 1 }, { unique: true });
batchSchema.index({ courseId: 1 });


batchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


module.exports = mongoose.model("Batch", batchSchema);