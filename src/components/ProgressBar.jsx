// ProgressBar.jsx - Compact visual progress bar with motivational status
import React from 'react';

function ProgressBar({ total = 0, completed = 0 }) {
  const calculatePercentage = () => {
    if (total === 0) {
      return 0;
    }
    return Math.round((completed / total) * 100);
  };

  const percentage = calculatePercentage();
  const pendingCount = Math.max(0, total - completed);

  const getMotivationalMessage = () => {
    if (total === 0) return 'No tasks yet. Add a task to begin!';
    if (percentage === 100) return '🎉 All tasks completed! Outstanding work!';
    if (percentage >= 75) return `Almost there! Only ${pendingCount} task${pendingCount === 1 ? '' : 's'} left.`;
    if (percentage >= 50) return `Over halfway done! Keep up the momentum.`;
    return `${pendingCount} task${pendingCount === 1 ? '' : 's'} remaining today.`;
  };

  return (
    <section className="progress-section">
      <div className="progress-header">
        <div className="progress-title-wrap">
          <span className="progress-label">Task Progress</span>
          <span className="progress-subtitle">({completed} of {total} done) — {getMotivationalMessage()}</span>
        </div>
        <span className="progress-percent">{percentage}%</span>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}

export default ProgressBar;
