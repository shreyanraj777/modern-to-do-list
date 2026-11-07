// TaskItem.jsx - Compact interactive task item with animated checkbox, floating score, and collapsible notes
import React, { useState } from 'react';

// Formats an ISO date string into a smart compact deadline display.
const formatDeadlineDisplay = (dateStr) => {
  if (!dateStr) {
    return 'No deadline';
  }
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid deadline';
  }

  const now = new Date();
  const isToday =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    dateObj.getDate() === tomorrow.getDate() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getFullYear() === tomorrow.getFullYear();

  const timeStr = dateObj.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow) {
    return `Tomorrow at ${timeStr}`;
  }

  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formats an ISO date string into datetime-local input format.
const formatForDateTimeInput = (dateStr) => {
  if (!dateStr) {
    return '';
  }
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function TaskItem({ task, onToggleComplete, onDeleteTask, onUpdateTask }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'Medium');
  const [editDeadline, setEditDeadline] = useState(formatForDateTimeInput(task.deadline));
  const [editError, setEditError] = useState('');

  // Handles toggling the task completion status with celebratory animation
  const handleToggle = () => {
    const idToToggle = task.id || task._id;
    if (!task.completed) {
      // Trigger floating +30 pts badge
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
      }, 1300);
    }
    onToggleComplete(idToToggle);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(`Delete "${task.title}"?`);
    if (confirmed) {
      const idToDelete = task.id || task._id;
      onDeleteTask(idToDelete);
    }
  };

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'Medium');
    setEditDeadline(formatForDateTimeInput(task.deadline));
    setEditError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'Medium');
    setEditDeadline(formatForDateTimeInput(task.deadline));
    setEditError('');
    setIsEditing(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError('Title cannot be empty');
      return;
    }

    let parsedDeadline = null;
    if (editDeadline) {
      const dateObj = new Date(editDeadline);
      if (isNaN(dateObj.getTime())) {
        setEditError('Invalid deadline date');
        return;
      }
      parsedDeadline = dateObj.toISOString();
    }

    const taskId = task.id || task._id;
    onUpdateTask(taskId, {
      title: trimmedTitle,
      description: editDescription.trim(),
      priority: editPriority,
      deadline: parsedDeadline,
    });

    setIsEditing(false);
  };

  const isOverdue = !task.completed && task.deadline && new Date(task.deadline) < new Date();
  const priorityLower = task.priority ? task.priority.toLowerCase() : 'medium';

  if (isEditing) {
    return (
      <li className="task-item editing">
        <form className="edit-task-form" onSubmit={handleSaveEdit}>
          {editError && (
            <div className="input-error-banner" role="alert">
              ⚠️ {editError}
            </div>
          )}

          <div className="edit-form-row">
            <input
              type="text"
              className="edit-input"
              style={{ flex: 1 }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task Title"
              autoFocus
            />

            <select
              className="edit-input"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <input
              type="datetime-local"
              className="edit-input"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
            />
          </div>

          <textarea
            className="edit-input task-textarea"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description / notes (optional)"
            rows={2}
          />

          <div className="edit-actions">
            <button type="submit" className="btn btn-sm btn-primary">
              Save
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  const renderStatusBadge = () => {
    if (task.completed) {
      if (task.completedOnTime === false) {
        return (
          <span className="badge status-badge status-late" title="Completed after deadline">
            Late (-50 pts)
          </span>
        );
      }
      return (
        <span className="badge status-badge status-done" title="Completed on time!">
          Done (+30 pts)
        </span>
      );
    }

    if (isOverdue) {
      return (
        <span className="badge status-badge status-overdue" title="Overdue task!">
          Overdue (-50 pts)
        </span>
      );
    }

    return (
      <span className="badge status-badge status-pending">
        Pending
      </span>
    );
  };

  const itemClass = `task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'item-overdue' : ''}`;

  return (
    <li className={itemClass}>
      {/* Floating Gamification Score Animation */}
      {showCelebration && (
        <div className="floating-celebration">
          +30 pts! 🎉
        </div>
      )}

      {/* Main Single Row */}
      <div className="task-item-main-row">
        <div className="task-left-section">
          {/* Animated Custom Checkbox */}
          <label className="custom-checkbox-wrap" title={task.completed ? 'Mark incomplete' : 'Mark complete (+30 pts)'}>
            <input
              type="checkbox"
              className="task-checkbox-input"
              checked={Boolean(task.completed)}
              onChange={handleToggle}
              aria-label={`Mark "${task.title}" as complete`}
            />
          </label>

          <div className="task-details-col">
            <span
              className="task-title"
              title={task.title}
              onDoubleClick={handleStartEdit}
            >
              {task.title}
            </span>

            <div className="task-badges-inline">
              {task.priority && (
                <span className={`badge priority-${priorityLower}`}>
                  {task.priority}
                </span>
              )}

              {task.deadline && (
                <span className={`deadline-badge ${isOverdue ? 'deadline-overdue' : ''}`}>
                  🕒 {formatDeadlineDisplay(task.deadline)}
                </span>
              )}

              {renderStatusBadge()}

              {task.description && (
                <button
                  type="button"
                  className="note-toggle-btn"
                  onClick={() => setShowNote(!showNote)}
                  title={showNote ? 'Hide notes' : 'View notes'}
                >
                  📝 {showNote ? 'Hide' : 'Note'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hover Quick Action Buttons */}
        <div className="task-actions">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleStartEdit}
            title="Edit task"
          >
            Edit
          </button>

          <button
            type="button"
            className={`btn btn-sm ${task.completed ? 'btn-outline' : 'btn-success'}`}
            onClick={handleToggle}
            title={task.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.completed ? 'Undo' : 'Done'}
          </button>

          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={handleDelete}
            title="Delete task"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Collapsible Note Drawer */}
      {showNote && task.description && (
        <div className="task-description-drawer">
          <strong>Notes: </strong>{task.description}
        </div>
      )}
    </li>
  );
}

export default TaskItem;
