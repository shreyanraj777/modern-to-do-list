// Header.jsx - Compact top bar with live date, gamification metrics, and density toggle
import React from 'react';

// Formats today's date into a readable string (e.g., "Wed, Oct 25").
const formatCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

function Header({ points = 0, streak = '0 Days', isCompact = false, onToggleCompact }) {
  const currentDateStr = formatCurrentDate();
  const pointsFormatted = points > 0 ? `+${points} pts` : `${points} pts`;

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-brand">
          <span className="brand-badge">PBL</span>
          <h1 className="header-title">Modern To-Do</h1>
        </div>
        <span className="header-date-pill" title="Current Date">
          📅 {currentDateStr}
        </span>
      </div>

      <div className="header-right">
        <div
          className="header-metric-pill pill-streak"
          title={`Consecutive productive days: ${streak}`}
        >
          <span>🔥</span>
          <span>{streak}</span>
        </div>

        <div
          className={`header-metric-pill pill-points ${points < 0 ? 'points-negative' : ''}`}
          title="Productivity Score (+30 on-time, -50 late/overdue)"
        >
          <span>⭐</span>
          <span>{pointsFormatted}</span>
        </div>

        {onToggleCompact && (
          <button
            type="button"
            className="density-toggle-btn"
            onClick={onToggleCompact}
            title={isCompact ? 'Switch to Normal View' : 'Switch to Compact View'}
          >
            <span>{isCompact ? '⊞' : '⊟'}</span>
            <span>{isCompact ? 'Normal' : 'Compact'}</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
