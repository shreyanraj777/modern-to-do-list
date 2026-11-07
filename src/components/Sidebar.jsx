// Sidebar.jsx - Compact interactive navigation sidebar with status counts and quick tip
import React from 'react';

function Sidebar({ currentFilter, onSelectFilter, counts }) {
  const navItems = [
    { key: 'all', label: 'All Tasks', icon: '📋', count: counts.all || 0 },
    { key: 'pending', label: 'Pending', icon: '⏳', count: counts.pending || 0 },
    { key: 'completed', label: 'Completed', icon: '✅', count: counts.completed || 0 },
    { key: 'overdue', label: 'Overdue', icon: '⚠️', count: counts.overdue || 0 },
  ];

  const renderNavItem = (item) => {
    const handleFilterClick = () => {
      onSelectFilter(item.key);
    };

    const isActive = currentFilter === item.key;
    const isOverdueAlert = item.key === 'overdue' && item.count > 0;
    const buttonClass = `nav-btn ${isActive ? 'active' : ''} ${isOverdueAlert ? 'nav-btn-overdue has-overdue' : ''}`;

    return (
      <button
        key={item.key}
        type="button"
        className={buttonClass}
        onClick={handleFilterClick}
      >
        <span className="nav-btn-content">
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </span>
        <span className="nav-badge">{item.count}</span>
      </button>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-heading">Navigation</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(renderNavItem)}
      </nav>

      <div className="sidebar-footer-card">
        <strong>⚡ Pro Tip</strong>
        Hit Enter to instantly add tasks. Click stat cards to quick-filter.
      </div>
    </aside>
  );
}

export default Sidebar;
