// TaskList.jsx - Interactive task list with real-time search, priority filter, sorting, and scrollable container
import React, { useState, useMemo } from 'react';
import TaskItem from './TaskItem';

const PRIORITY_ORDER = {
  High: 3,
  Medium: 2,
  Low: 1,
};

function TaskList({
  tasks = [],
  onToggleComplete,
  onDeleteTask,
  onUpdateTask,
  currentFilter = 'all',
  isLoading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // Interactive filtering and sorting
  const processedTasks = useMemo(() => {
    let list = [...tasks];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const titleMatch = t.title && t.title.toLowerCase().includes(q);
        const descMatch = t.description && t.description.toLowerCase().includes(q);
        return titleMatch || descMatch;
      });
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // Sort
    if (sortBy === 'deadline') {
      list.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    } else if (sortBy === 'priority') {
      list.sort((a, b) => {
        const pA = PRIORITY_ORDER[a.priority] || 0;
        const pB = PRIORITY_ORDER[b.priority] || 0;
        return pB - pA;
      });
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [tasks, searchQuery, priorityFilter, sortBy]);

  if (isLoading) {
    return (
      <section className="task-list-section">
        <div className="empty-state">
          <p className="empty-title">Loading tasks...</p>
          <p className="empty-desc">Connecting to database.</p>
        </div>
      </section>
    );
  }

  const getEmptyMessage = () => {
    if (searchQuery || priorityFilter !== 'all') {
      return 'No tasks match your search/filter criteria. Try clearing the filters.';
    }
    if (currentFilter === 'all') {
      return 'You have no tasks right now. Use the Quick-Add bar above to get started!';
    }
    if (currentFilter === 'pending') {
      return '🎉 Great job! You have no pending tasks.';
    }
    if (currentFilter === 'completed') {
      return 'No completed tasks yet. Finish a task above to earn +30 points!';
    }
    if (currentFilter === 'overdue') {
      return '🌟 All deadlines on track! No overdue tasks.';
    }
    return `You have no ${currentFilter} tasks.`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
  };

  return (
    <section className="task-list-section">
      {/* Interactive Toolbar */}
      <div className="task-toolbar">
        <div className="toolbar-left">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <span className="task-counter-pill">
            {processedTasks.length} {processedTasks.length === 1 ? 'task' : 'tasks'}
            {tasks.length !== processedTasks.length && ` (of ${tasks.length})`}
          </span>
        </div>

        <div className="toolbar-right">
          <select
            className="toolbar-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort tasks"
          >
            <option value="default">Sort: Default</option>
            <option value="deadline">Sort: Due Soonest</option>
            <option value="priority">Sort: High Priority</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Dedicated Scroll Container - prevents full page scrolling */}
      <div className="task-scroll-container">
        {processedTasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-title">No tasks found</p>
            <p className="empty-desc">{getEmptyMessage()}</p>
            {(searchQuery || priorityFilter !== 'all') && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ marginTop: '8px' }}
                onClick={clearFilters}
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <ul className="task-list">
            {processedTasks.map((task) => {
              const key = task.id || task._id;
              return (
                <TaskItem
                  key={key}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onDeleteTask={onDeleteTask}
                  onUpdateTask={onUpdateTask}
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default TaskList;
