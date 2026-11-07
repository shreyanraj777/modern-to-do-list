// TaskInput.jsx - Compact interactive Quick-Add bar with 1-click presets & expand drawer
import React, { useState } from 'react';

// Helper function to format a Date into datetime-local value string (YYYY-MM-DDTHH:mm).
const formatToLocalDateTime = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function TaskInput({ onAddTask }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleDeadlineChange = (e) => {
    setDeadline(e.target.value);
  };

  // Quick preset deadline buttons
  const applyDeadlinePreset = (preset) => {
    const now = new Date();
    if (preset === 'today') {
      const today = new Date(now);
      today.setHours(18, 0, 0, 0); // Today 6:00 PM
      setDeadline(formatToLocalDateTime(today));
    } else if (preset === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0); // Tomorrow 6:00 PM
      setDeadline(formatToLocalDateTime(tomorrow));
    } else if (preset === 'weekend') {
      const weekend = new Date(now);
      const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
      weekend.setDate(weekend.getDate() + daysUntilSat);
      weekend.setHours(18, 0, 0, 0);
      setDeadline(formatToLocalDateTime(weekend));
    } else if (preset === 'clear') {
      setDeadline('');
    }
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Task title is required.');
      return;
    }

    let validDeadline = null;
    if (deadline) {
      const parsed = new Date(deadline);
      if (isNaN(parsed.getTime())) {
        setErrorMessage('Please enter a valid deadline date.');
        return;
      }
      validDeadline = parsed.toISOString();
    }

    onAddTask({
      title: trimmedTitle,
      description: description.trim(),
      priority,
      deadline: validDeadline,
    });

    setTitle('');
    setDescription('');
    setDeadline('');
    setErrorMessage('');
    setIsDrawerOpen(false);
  };

  return (
    <section className="task-input-section">
      {errorMessage && (
        <div className="input-error-banner" role="alert">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      <form className="task-form" onSubmit={handleSubmit}>
        {/* Compact Single Row */}
        <div className="quick-add-row">
          <input
            type="text"
            className="task-input-main"
            placeholder="Add task... (press Enter to save)"
            value={title}
            onChange={handleTitleChange}
            aria-label="Task Title"
          />

          {/* Interactive Priority Selector Pills */}
          <div className="quick-priority-pills" role="radiogroup" aria-label="Task Priority">
            {['Low', 'Medium', 'High'].map((p) => (
              <button
                key={p}
                type="button"
                className={`priority-pill-btn ${priority === p ? `active pill-${p.toLowerCase()}` : ''}`}
                onClick={() => setPriority(p)}
                aria-pressed={priority === p}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Expand Details Drawer Toggle */}
          <button
            type="button"
            className={`drawer-toggle-btn ${isDrawerOpen ? 'active' : ''}`}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            title="Toggle notes and custom deadline"
          >
            <span>{isDrawerOpen ? '▴ Details' : '▾ Details'}</span>
            {deadline && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>}
          </button>

          <button type="submit" className="btn btn-primary">
            + Add
          </button>
        </div>

        {/* Collapsible Details Drawer */}
        {isDrawerOpen && (
          <div className="task-form-drawer">
            <textarea
              className="task-textarea"
              placeholder="Task description / notes (optional)..."
              rows={2}
              value={description}
              onChange={handleDescriptionChange}
              aria-label="Task Description"
            />

            <div className="drawer-controls-row">
              <div className="quick-deadline-presets">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Due:</span>
                <button
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => applyDeadlinePreset('today')}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => applyDeadlinePreset('tomorrow')}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  className="preset-chip-btn"
                  onClick={() => applyDeadlinePreset('weekend')}
                >
                  Weekend
                </button>
                {deadline && (
                  <button
                    type="button"
                    className="preset-chip-btn"
                    style={{ color: '#ef4444' }}
                    onClick={() => applyDeadlinePreset('clear')}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <input
                id="custom-deadline-input"
                type="datetime-local"
                className="deadline-input"
                value={deadline}
                onChange={handleDeadlineChange}
                aria-label="Custom Deadline"
              />
            </div>
          </div>
        )}
      </form>
    </section>
  );
}

export default TaskInput;
