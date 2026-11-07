// models/Task.js - Mongoose Schema for Task items with deadlines, priorities, and scoring
import mongoose from 'mongoose';

// Schema definition for Task documents storing task details, deadlines, and scoring metrics.
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    deadline: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedOnTime: {
      type: Boolean,
      default: null,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Helper transform function to format MongoDB document JSON output.
const transformDocumentJson = (doc, ret) => {
  ret.id = ret._id.toString();
  return ret;
};

taskSchema.set('toJSON', {
  virtuals: true,
  transform: transformDocumentJson,
});

// Exports the Task model for database operations.
const Task = mongoose.model('Task', taskSchema);

export default Task;
