// Stats.jsx - Compact interactive metrics strip where clicking cards filters tasks
import React from 'react';

function Stats({
  total = 0,
  completed = 0,
  pending = 0,
  overdue = 0,
  currentFilter = 'all',
  onSelectFilter,
}) {
  const statCards = [
    {
      filterKey: 'all',
      label: 'Total Tasks',
      value: total,
      tone: 'primary',
      badge: 'All',
      hint: 'Click to view all',
    },
    {
      filterKey: 'pending',
      label: 'Pending',
      value: pending,
      tone: 'warning',
      badge: 'Active',
      hint: 'Click to view active',
    },
    {
      filterKey: 'completed',
      label: 'Completed',
      value: completed,
      tone: 'success',
      badge: 'Done',
      hint: '+30 pts on time',
    },
    {
      filterKey: 'overdue',
      label: 'Overdue',
      value: overdue,
      tone: overdue > 0 ? 'danger' : 'neutral',
      badge: overdue > 0 ? 'Urgent' : 'Clean',
      hint: overdue > 0 ? '-50 pts penalty' : 'On track',
    },
  ];

  const renderCard = (card) => {
    const isActive = currentFilter === card.filterKey;
    const cardClass = `stat-card stat-${card.tone} ${isActive ? 'stat-active' : ''}`;

    const handleCardClick = () => {
      if (onSelectFilter) {
        onSelectFilter(card.filterKey);
      }
    };

    return (
      <div
        key={card.label}
        className={cardClass}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick();
          }
        }}
        title={card.hint}
      >
        <div className="stat-header">
          <span className="stat-label">{card.label}</span>
          <span className={`stat-badge badge-${card.tone}`}>{card.badge}</span>
        </div>
        <div className="stat-body">
          <span className="stat-value">{card.value}</span>
          <span className="stat-hint">{card.hint}</span>
        </div>
      </div>
    );
  };

  return (
    <section className="stats-container">
      {statCards.map(renderCard)}
    </section>
  );
}

export default Stats;
