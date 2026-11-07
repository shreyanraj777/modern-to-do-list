// App.jsx - Main Application Component for Modern To-Do List (Phases 1-7 Integrated)
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Stats from './components/Stats';
import ProgressBar from './components/ProgressBar';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import {
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
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompact, setIsCompact] = useState(true); // Default to sleek compact view
  const [toasts, setToasts] = useState([]);

  // Shows interactive toast notifications
  const showToast = (message, tone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Loads all tasks from the backend API.
  const loadTasks = async () => {
    try {
      const data = await fetchTasksApi();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setErrorMessage(err.message || 'Unable to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles manual retry of loading tasks.
  const handleRetryLoad = () => {
    setErrorMessage('');
    setIsLoading(true);
    loadTasks();
  };

  // Effect hook to load tasks from backend upon initial mount.
  useEffect(() => {
    let isMounted = true;

    const initializeTasks = async () => {
      try {
        const data = await fetchTasksApi();
        if (isMounted) {
          setTasks(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load tasks:', err);
          setErrorMessage(err.message || 'Unable to connect to the backend server.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeTasks();

    return () => {
      isMounted = false;
    };
  }, []);

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
