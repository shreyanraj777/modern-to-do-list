# Modern To-Do List & Productivity Dashboard

A modern, high-performance, compact To-Do and Task Productivity application built with React, Vite, Node.js Express, and MongoDB.

## Features

- **Viewport-Optimized Compact UI**: High information density design that eliminates endless page scrolling; includes a custom dedicated scroll container for tasks.
- **Interactive Productivity Dashboard**:
  - Clickable status cards (`All`, `Pending`, `Completed`, `Overdue`) that double as instant filter tabs.
  - Streak tracking (`🔥 Consecutive Days`) and Productivity score balance (`⭐ Points`).
  - Integrated visual progress bar with motivational milestones.
- **Fast Quick-Add Bar**:
  - Keyboard accessible: hit `Enter` to create tasks instantly.
  - 1-click Priority selector pills (`Low`, `Medium`, `High`).
  - 1-click deadline presets: `Today`, `Tomorrow`, `Weekend`.
  - Expandable drawer for detailed notes and custom date-time scheduling.
- **Real-Time Task Management**:
  - Live real-time search toolbar (`🔍 Search tasks...`).
  - Priority filtering and multi-criteria sorting (Due Soonest, High Priority, Title A-Z).
  - Animated checkbox completion with celebratory score popups (`+30 pts! 🎉`).
  - Collapsible task notes and inline editing (`Enter` to save, `Esc` to cancel).
  - Floating interactive toast notifications.
- **Density Toggle**: Toggle between `Compact` and `Normal` views anytime.

## Tech Stack

- **Frontend**: React 19, Vite 8, Modern CSS (Design variables, flexbox/grid, custom animations).
- **Backend**: Node.js, Express 5, Mongoose 9, MongoDB.
- **Tooling**: Oxlint for fast linting, CORS, Dotenv.

## Project Structure

```
├── models/
│   └── Task.js              # Mongoose task schema & scoring model
├── utils/
│   └── taskHelpers.js       # Streak and score calculation helpers
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Top bar with date, streak, points & density toggle
│   │   ├── Sidebar.jsx      # Navigation sidebar with counts and tips
│   │   ├── Stats.jsx        # Clickable stat chips
│   │   ├── ProgressBar.jsx  # Compact progress indicator
│   │   ├── TaskInput.jsx    # Quick-add task bar with presets
│   │   ├── TaskItem.jsx     # Compact task item with animations
│   │   └── TaskList.jsx     # Scrollable task container with search & sort
│   ├── api.js               # Frontend REST API client
│   ├── App.jsx              # Main application state and toast manager
│   ├── dashboard.css        # Stats and progress styles
│   ├── index.css            # Layout, variables, toast styles
│   ├── navigation.css       # Header and sidebar styles
│   ├── taskForm.css         # Quick-add form styles
│   └── taskList.css         # Task list and animation styles
├── server.js                # Express backend server
└── vite.config.js           # Vite dev server configuration & API proxy
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally on port 27017 or a MongoDB Atlas URI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shreyanraj777/modern-to-do-list.git
   cd modern-to-do-list
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

5. In a separate terminal, start the Vite development server:
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5173`.
