// server.js - Node.js Express backend server with Email OTP Authentication and Task Management
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Task from './models/Task.js';
import { evaluateTaskOutcome, calculateStats } from './utils/taskHelpers.js';
import { createAndSendOtp, verifyOtpCode } from './utils/otpHelpers.js';
import { requireAuth } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todolist_pbl';
const JWT_SECRET = process.env.JWT_SECRET || 'modern_todo_pbl_super_secret_jwt_key_2026';

// Middleware configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Seeds default demonstration tasks for newly registered and verified users.
const seedTasksForUser = async (userId) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const welcomeTasks = [
      {
        userId: userId,
        title: 'Welcome to Modern To-Do!',
        description: 'Check out the interactive dashboard and real-time filters',
        priority: 'High',
        deadline: tomorrow,
        completed: false,
      },
      {
        userId: userId,
        title: 'Explore points and streaks',
        description: 'Complete tasks before deadline to earn +30 points and build your streak',
        priority: 'Medium',
        deadline: threeDaysLater,
        completed: false,
      },
    ];

    await Task.insertMany(welcomeTasks);
  } catch (seedError) {
    console.error('Error seeding initial tasks for user:', seedError);
  }
};

// Connects to MongoDB database using Mongoose.
const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully to:', MONGO_URI);
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
  }
};

// Root health-check endpoint.
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Modern To-Do List MERN Backend with Email OTP Authentication is running',
  });
});

// ==========================================
// AUTHENTICATION MODULE ENDPOINTS
// ==========================================

// Registers a new user account, stores password securely, and dispatches email verification OTP.
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Full name is required.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email address is required.',
      });
    }

    if (!password) {
      return res.status(400).json({
        error: 'Password is required.',
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        error: 'Please confirm your password.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name.trim();
      existingUser.password = hashedPassword;
      await existingUser.save();
    } else {
      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isVerified: false,
      });
      await newUser.save();
    }

    await createAndSendOtp(normalizedEmail, 'registration');

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please verify to activate your account.',
      email: normalizedEmail,
      purpose: 'registration',
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        error: error.message,
        code: 'EMAIL_NOT_CONFIGURED',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to complete registration. Please try again later.',
    });
  }
});

// Validates user credentials and sends login OTP to user's registered email.
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email address is required.',
      });
    }

    if (!password) {
      return res.status(400).json({
        error: 'Password is required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid email or password.',
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Your email address is not verified yet. Please register to complete verification.',
      });
    }

    await createAndSendOtp(normalizedEmail, 'login');

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please enter it to complete login.',
      email: normalizedEmail,
      purpose: 'login',
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        error: error.message,
        code: 'EMAIL_NOT_CONFIGURED',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to process login. Please try again later.',
    });
  }
});

// Verifies the 6-digit OTP code on the backend and establishes an authenticated session.
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email address is required.',
      });
    }

    if (!otp || !otp.trim()) {
      return res.status(400).json({
        error: 'Verification code is required.',
      });
    }

    if (!purpose || !['registration', 'login'].includes(purpose)) {
      return res.status(400).json({
        error: 'Invalid verification purpose.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = await verifyOtpCode(normalizedEmail, otp, purpose);

    if (!verification.isValid) {
      return res.status(verification.status || 400).json({
        error: verification.error,
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        error: 'User account not found.',
      });
    }

    if (purpose === 'registration') {
      user.isVerified = true;
      await user.save();

      const existingCount = await Task.countDocuments({
        userId: user._id,
      });
      if (existingCount === 0) {
        await seedTasksForUser(user._id);
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      error: 'Failed to verify code. Please try again.',
    });
  }
});

// Resends a fresh OTP code respecting the 60-second cooldown policy.
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Email address is required.',
      });
    }

    if (!purpose || !['registration', 'login'].includes(purpose)) {
      return res.status(400).json({
        error: 'Invalid verification purpose.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        error: 'User account not found.',
      });
    }

    await createAndSendOtp(normalizedEmail, purpose);

    res.status(200).json({
      success: true,
      message: 'A fresh verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);

    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        error: error.message,
        code: 'EMAIL_NOT_CONFIGURED',
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to resend verification code. Please try again later.',
    });
  }
});

// Logs out the authenticated user by clearing the HTTP-only authentication cookie.
app.post('/api/auth/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('authToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// Retrieves the authenticated user profile information for session verification.
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

// ==========================================
// USER-SPECIFIC TASK MANAGEMENT ENDPOINTS
// ==========================================

// Retrieves all tasks belonging strictly to the authenticated user and synchronizes overdue states.
app.get('/api/tasks', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
    }).sort({
      createdAt: -1,
    });

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
    res.status(500).json({
      error: 'Failed to fetch tasks from database',
    });
  }
});

// Retrieves aggregated dashboard statistics (counts, points balance, and streak) for authenticated user.
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
    });
    const stats = calculateStats(tasks);
    res.json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({
      error: 'Failed to calculate stats',
    });
  }
});

// Creates a new task associated with the authenticated user ID.
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Task title is required',
      });
    }

    let parsedDeadline = null;
    if (deadline) {
      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({
          error: 'Invalid deadline format',
        });
      }
    }

    const validPriorities = ['Low', 'Medium', 'High'];
    const chosenPriority = validPriorities.includes(priority) ? priority : 'Medium';

    const newTask = new Task({
      userId: req.userId,
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
    res.status(500).json({
      error: 'Failed to create task',
    });
  }
});

// Updates an existing task belonging to the authenticated user.
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        error: 'Task title is required',
      });
    }

    const task = await Task.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found or access denied',
      });
    }

    let parsedDeadline = null;
    if (deadline) {
      parsedDeadline = new Date(deadline);
      if (isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({
          error: 'Invalid deadline format',
        });
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
    res.status(500).json({
      error: 'Failed to update task',
    });
  }
});

// Toggles completion state of a task belonging to the authenticated user and recalculates points.
app.patch('/api/tasks/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found or access denied',
      });
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
    res.status(500).json({
      error: 'Failed to toggle task',
    });
  }
});

// Deletes a task by ID ensuring it belongs to the authenticated user.
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deletedTask) {
      return res.status(404).json({
        error: 'Task not found or access denied',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      id: id,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: 'Failed to delete task',
    });
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
