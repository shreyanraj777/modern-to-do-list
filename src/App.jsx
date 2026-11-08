// App.jsx - Main Application Component for Modern To-Do List with Email OTP Authentication
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Stats from './components/Stats';
import ProgressBar from './components/ProgressBar';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import Login from './components/Login';
import Register from './components/Register';
import OtpVerification from './components/OtpVerification';
import {
  fetchCurrentUserApi,
  logoutApi,
  fetchTasksApi,
  createTaskApi,
  updateTaskApi,
  toggleTaskCompleteApi,
  deleteTaskApi,
} from './api';

// Helper function to format date to local YYYY-MM-DD string.
const toDateKey = (dateVal) => {
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Computes consecutive daily productive streak from task completion records.
const computeStreak = (taskList) => {
  const now = new Date();

  // Helper function to check if a task is incomplete and overdue.
  const isOverdueIncomplete = (task) => {
    if (task.completed) {
      return false;
    }
    if (!task.deadline) {
      return false;
    }
    return new Date(task.deadline) < now;
  };

  const hasOverdue = taskList.some(isOverdueIncomplete);
  if (hasOverdue) {
    return '0 Days';
  }

  // Helper function to filter completed tasks with timestamps.
  const isCompletedWithDate = (task) => {
    return Boolean(task.completed && task.completedAt);
  };

  const completedList = taskList.filter(isCompletedWithDate);
  if (completedList.length === 0) {
    return '0 Days';
  }

  // Helper function to extract local date string.
  const getDateStr = (task) => {
    return toDateKey(task.completedAt);
  };

  const dateSet = new Set(completedList.map(getDateStr));
  const todayStr = toDateKey(now);
  const yesterdayObj = new Date(now);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = toDateKey(yesterdayObj);

  let count = 0;
  let checkDate = new Date(now);

  if (dateSet.has(todayStr)) {
    while (true) {
      const key = toDateKey(checkDate);
      if (dateSet.has(key)) {
        count += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return `${count} ${count === 1 ? 'Day' : 'Days'}`;
  }

  if (dateSet.has(yesterdayStr)) {
    checkDate = yesterdayObj;
    while (true) {
      const key = toDateKey(checkDate);
      if (dateSet.has(key)) {
        count += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return `${count} ${count === 1 ? 'Day' : 'Days'}`;
  }

  return '0 Days';
};

// Calculates total points balance by summing pointsAwarded across all tasks.
const computePointsBalance = (taskList) => {
  const accumulatePoints = (sum, task) => {
    return sum + (task.pointsAwarded || 0);
  };

  return taskList.reduce(accumulatePoints, 0);
};

// Computes task status counts including total, completed, pending, and overdue.
const computeCounts = (taskList) => {
  const now = new Date();

  const isCompleted = (t) => {
    return Boolean(t.completed);
  };

  const isOverdue = (t) => {
    if (t.completed) {
      return false;
    }
    if (!t.deadline) {
      return false;
    }
    return new Date(t.deadline) < now;
  };

  const total = taskList.length;
  const completed = taskList.filter(isCompleted).length;
  const overdue = taskList.filter(isOverdue).length;
  const pending = total - completed;

  return {
    all: total,
    completed: completed,
    pending: pending,
    overdue: overdue,
  };
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'otp'
  const [otpContext, setOtpContext] = useState({
    email: '',
    purpose: 'login',
  });

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompact, setIsCompact] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Shows interactive toast notifications.
  const showToast = (message, tone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        tone,
      },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Loads all tasks belonging to the authenticated user from the backend API.
  const loadTasks = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await fetchTasksApi();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      if (err.status === 401) {
        setCurrentUser(null);
        setAuthView('login');
        showToast('Session expired. Please log in again.', 'warning');
      } else {
        setErrorMessage(err.message || 'Unable to connect to the backend server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verifies existing session cookie with backend on initial application load.
  useEffect(() => {
    let isMounted = true;

    // Checks current authentication session.
    const checkSession = async () => {
      try {
        const response = await fetchCurrentUserApi();
        if (isMounted && response && response.user) {
          setCurrentUser(response.user);
          loadTasks();
        }
      } catch (err) {
        if (isMounted) {
          console.debug('No active user session detected:', err.message);
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handles successful registration trigger transitioning user to OTP verification view.
  const handleRegisterSuccess = ({ email, purpose }) => {
    setOtpContext({
      email: email,
      purpose: purpose,
    });
    setAuthView('otp');
    showToast('Verification code sent to your email.', 'info');
  };

  // Handles successful login trigger transitioning user to OTP verification view.
  const handleLoginSuccess = ({ email, purpose }) => {
    setOtpContext({
      email: email,
      purpose: purpose,
    });
    setAuthView('otp');
    showToast('Verification code sent to your email.', 'info');
  };

  // Handles successful OTP verification logging user in and loading tasks.
  const handleVerificationSuccess = (user) => {
    setCurrentUser(user);
    setAuthView('login');
    loadTasks();
    showToast(`Welcome, ${user.name}!`, 'success');
  };

  // Logs out the authenticated user, clears session cookies, and returns to login screen.
  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
      setTasks([]);
      setAuthView('login');
      showToast('Logged out successfully.', 'info');
    }
  };

  // Handles manual retry of loading tasks.
  const handleRetryLoad = () => {
    setErrorMessage('');
    loadTasks();
  };

  // Adds a new task by calling backend API and updating local state.
  const handleAddTask = async (taskData) => {
    try {
      const created = await createTaskApi(taskData);
      const prependTask = (prevTasks) => [created, ...prevTasks];
      setTasks(prependTask);
      showToast(`Added: "${taskData.title}"`, 'success');
    } catch (err) {
      console.error('Failed to create task:', err);
      setErrorMessage(err.message || 'Failed to create task');
    }
  };

  // Updates an existing task by ID on backend and in local state.
  const handleUpdateTask = async (id, updatedFields) => {
    try {
      const updated = await updateTaskApi(id, updatedFields);
      const mapUpdatedTask = (task) => {
        const taskId = task.id || task._id;
        if (taskId === id) {
          return updated;
        }
        return task;
      };

      const applyUpdate = (prevTasks) => prevTasks.map(mapUpdatedTask);
      setTasks(applyUpdate);
      showToast('Task updated successfully', 'info');
    } catch (err) {
      console.error('Failed to update task:', err);
      setErrorMessage(err.message || 'Failed to update task');
    }
  };

  // Toggles task completion on backend and updates local task list.
  const handleToggleComplete = async (taskId) => {
    try {
      const updated = await toggleTaskCompleteApi(taskId);
      const mapToggledTask = (task) => {
        const currentId = task.id || task._id;
        if (currentId === taskId) {
          return updated;
        }
        return task;
      };

      const applyToggle = (prevTasks) => prevTasks.map(mapToggledTask);
      setTasks(applyToggle);

      if (updated.completed) {
        const pts = updated.pointsAwarded || 30;
        showToast(`🎉 Completed! +${pts} pts awarded`, 'success');
      } else {
        showToast('Task marked incomplete', 'info');
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
      setErrorMessage(err.message || 'Failed to toggle task completion');
    }
  };

  // Deletes a task by ID on backend and removes it from local state.
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTaskApi(taskId);
      const filterOutDeleted = (task) => {
        const currentId = task.id || task._id;
        return currentId !== taskId;
      };

      const applyDelete = (prevTasks) => prevTasks.filter(filterOutDeleted);
      setTasks(applyDelete);
      showToast('Task deleted', 'warning');
    } catch (err) {
      console.error('Failed to delete task:', err);
      setErrorMessage(err.message || 'Failed to delete task');
    }
  };

  // If initial auth session check is pending, show a loading placeholder.
  if (isAuthChecking) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <span className="auth-brand-badge" style={{ alignSelf: 'center', marginBottom: '12px' }}>
            PBL
          </span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Checking authentication session...
          </p>
        </div>
      </div>
    );
  }

  // If user is unauthenticated, render the appropriate authentication view.
  if (!currentUser) {
    return (
      <div className="app-container">
        {/* Floating Toast Notifications */}
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.tone}`}>
              {t.message}
            </div>
          ))}
        </div>

        {authView === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={() => setAuthView('register')}
          />
        )}

        {authView === 'register' && (
          <Register
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}

        {authView === 'otp' && (
          <OtpVerification
            email={otpContext.email}
            purpose={otpContext.purpose}
            onVerificationSuccess={handleVerificationSuccess}
            onBackToAuth={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  // Authenticated Dashboard View
  const counts = computeCounts(tasks);
  const pointsBalance = computePointsBalance(tasks);
  const currentStreak = computeStreak(tasks);

  // Filters tasks based on the currently active sidebar navigation tab.
  const getFilteredTasks = () => {
    const now = new Date();

    const matchesFilter = (task) => {
      if (filter === 'completed') {
        return Boolean(task.completed);
      }
      if (filter === 'pending') {
        return !task.completed;
      }
      if (filter === 'overdue') {
        if (task.completed) {
          return false;
        }
        if (!task.deadline) {
          return false;
        }
        return new Date(task.deadline) < now;
      }
      return true;
    };

    return tasks.filter(matchesFilter);
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className={`app-container ${isCompact ? 'compact-mode' : ''}`}>
      {/* Floating Interactive Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>

      <Header
        points={pointsBalance}
        streak={currentStreak}
        isCompact={isCompact}
        onToggleCompact={() => setIsCompact(!isCompact)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {errorMessage && (
        <div className="app-error-banner" role="alert">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleRetryLoad}
          >
            Retry
          </button>
        </div>
      )}

      <div className="app-layout">
        <Sidebar
          currentFilter={filter}
          onSelectFilter={setFilter}
          counts={counts}
        />

        <main className="main-content">
          <div className="stats-progress-wrapper">
            <Stats
              total={counts.all}
              completed={counts.completed}
              pending={counts.pending}
              overdue={counts.overdue}
              currentFilter={filter}
              onSelectFilter={setFilter}
            />

            <ProgressBar
              total={counts.all}
              completed={counts.completed}
            />
          </div>

          <TaskInput onAddTask={handleAddTask} />

          <TaskList
            tasks={filteredTasks}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            currentFilter={filter}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
