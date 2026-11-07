// server.js - Node.js Express backend server for Modern To-Do List Application
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Task from './models/Task.js';
import { evaluateTaskOutcome, calculateStats } from './utils/taskHelpers.js';

dotenv.config();

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todolist_pbl';

// Connects to MongoDB database using Mongoose.
const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully to:', MONGO_URI);
    await seedInitialTasksIfEmpty();
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  }
};

// Seeds default demonstration tasks if the database is currently empty.
const seedInitialTasksIfEmpty = async () => {
  try {
    const existingCount = await Task.countDocuments();
    if (existingCount > 0) {
      return;
    }

    const now = new Date();
    const today = new Date(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const initialTasks = [
      {
        title: 'Complete Phase 1 UI design',
        description: 'Design dashboard layout and responsive sidebar',
        priority: 'High',
        deadline: tomorrow,
        completed: true,
        completedAt: today,
        completedOnTime: true,
        pointsAwarded: 30,
      },
      {
        title: 'Review college PBL requirements',
        description: 'Check Phase 2 Task CRUD guidelines',
        priority: 'Medium',
        deadline: today,
        completed: true,
        completedAt: yesterday,
        completedOnTime: true,
        pointsAwarded: 30,
      },
      {
        title: 'Prepare React component structure',
        description: 'Set up props, state, and event callbacks',
        priority: 'High',
        deadline: tomorrow,
        completed: false,
        completedAt: null,
        completedOnTime: null,
        pointsAwarded: 0,
      },
      {
        title: 'Read MERN stack documentation',
        description: 'Study React state management and hooks',
        priority: 'Low',
        deadline: threeDaysLater,
        completed: false,
        completedAt: null,
        completedOnTime: null,
        pointsAwarded: 0,
      },
    ];

    await Task.insertMany(initialTasks);
    console.log('Initial sample tasks seeded successfully.');
  } catch (seedError) {
    console.error('Error seeding initial tasks:', seedError);
  }
};

// Root health-check endpoint.
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Modern To-Do List MERN Backend is running',
  });
});

// Retrieves all tasks and recalculates any overdue statuses.
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    // Helper function to update overdue status if incomplete task passed deadline.
    const checkAndSyncTask = async (task) => {
      const outcome = evaluateTaskOutcome(task);
      const isPointsDifferent = task.pointsAwarded !== outcome.pointsAwarded;
      const isOnTimeDifferent = task.completedOnTime !== outcome.completedOnTime;

      if (isPointsDifferent || isOnTimeDifferent) {
        task.pointsAwarded = outcome.pointsAwarded;
        task.completedOnTime = outcome.completedOnTime;
        await task.save();
      }
      return task;
    };

    const syncedTasks = await Promise.all(tasks.map(checkAndSyncTask));
    res.json(syncedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks from database' });
  }
});

// Retrieves aggregated dashboard statistics (counts, points balance, and streak).
app.get('/api/stats', async (req, res) => {
  try {
    const tasks = await Task.find();
    const stats = calculateStats(tasks);
    res.json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// Creates a new task with validation for title, priority, and deadline.
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    let parsedDeadline = null;
    if (deadline) {
      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ error: 'Invalid deadline format' });
      }
    }

    const validPriorities = ['Low', 'Medium', 'High'];
    const chosenPriority = validPriorities.includes(priority) ? priority : 'Medium';

    const newTask = new Task({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: chosenPriority,
      deadline: parsedDeadline,
      completed: false,
    });

    const initialOutcome = evaluateTaskOutcome(newTask);
    newTask.pointsAwarded = initialOutcome.pointsAwarded;
    newTask.completedOnTime = initialOutcome.completedOnTime;

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Updates an existing task's title, description, priority, or deadline.
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    let parsedDeadline = null;
    if (deadline) {
      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({ error: 'Invalid deadline format' });
      }
    }

    task.title = title.trim();
    task.description = description !== undefined ? description.trim() : task.description;
    if (priority) {
      task.priority = priority;
    }
    task.deadline = parsedDeadline;

    const updatedOutcome = evaluateTaskOutcome(task);
    task.pointsAwarded = updatedOutcome.pointsAwarded;
    task.completedOnTime = updatedOutcome.completedOnTime;

    const savedTask = await task.save();
    res.json(savedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Toggles completion state of a task and applies points scoring rules.
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newCompleted = !task.completed;
    task.completed = newCompleted;

    if (newCompleted) {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    const outcome = evaluateTaskOutcome(task);
    task.completedOnTime = outcome.completedOnTime;
    task.pointsAwarded = outcome.pointsAwarded;

    const savedTask = await task.save();
    res.json(savedTask);
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// Deletes a task by ID.
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, message: 'Task deleted successfully', id });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Starts the HTTP server after initializing database connection.
const startServer = async () => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();