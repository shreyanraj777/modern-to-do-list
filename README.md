# Modern To-Do List & Productivity Dashboard

A modern, high-performance, compact To-Do and Task Productivity application built with React, Vite, Node.js Express, and MongoDB. Includes secure Email OTP Authentication with user-isolated task data, deadlines, points, and streaks.

## Features

- **Email OTP Authentication**:
  - Secure user registration with email verification.
  - Login workflow protected by 6-digit one-time password (OTP) verification sent to email.
  - Cryptographic password hashing with bcryptjs (passwords never stored in plain text).
  - Single-use hashed OTP verification with 5-minute expiry and 5-attempt brute-force protection.
  - 60-second OTP resend cooldown timer.
  - Session management using secure HTTP-only cookies and JWT.
  - Complete user task isolation: each user has their own tasks, points balance, and streak tracking.
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
- **Authentication & Security**: JWT (`jsonwebtoken`), `cookie-parser`, `bcryptjs`, Node.js `crypto`.
- **Email Service**: Nodemailer (Configurable SMTP).
- **Tooling**: Oxlint for fast linting, CORS, Dotenv.

## Project Structure

```
├── middleware/
│   └── authMiddleware.js    # JWT verification & route protection
├── models/
│   ├── Otp.js               # Hashed single-use OTP schema with TTL index
│   ├── Task.js              # Mongoose task schema & scoring model with user ownership
│   └── User.js              # User account schema with password hash & verification flag
├── tests/
│   └── testAuthSuite.js     # Automated 20-scenario test suite
├── utils/
│   ├── emailService.js      # Nodemailer SMTP email dispatcher
│   ├── otpHelpers.js        # 6-digit OTP generator, hasher & validator
│   └── taskHelpers.js       # Streak and score calculation helpers
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Top bar with user profile, logout, date & stats
│   │   ├── Login.jsx        # Login form with credential validation
│   │   ├── OtpVerification.jsx # 6-digit OTP verification with countdown timer
│   │   ├── ProgressBar.jsx  # Compact progress indicator
│   │   ├── Register.jsx     # Registration form with email validation
│   │   ├── Sidebar.jsx      # Navigation sidebar with counts and tips
│   │   ├── Stats.jsx        # Clickable stat chips
│   │   ├── TaskInput.jsx    # Quick-add task bar with presets
│   │   ├── TaskItem.jsx     # Compact task item with animations
│   │   └── TaskList.jsx     # Scrollable task container with search & sort
│   ├── api.js               # Frontend REST API client (auth & tasks)
│   ├── App.jsx              # Main application state and toast manager
│   ├── auth.css             # Registration, login & OTP styles
│   ├── dashboard.css        # Stats and progress styles
│   ├── index.css            # Layout, variables, toast styles
│   ├── navigation.css       # Header and sidebar styles
│   ├── taskForm.css         # Quick-add form styles
│   └── taskList.css         # Task list and animation styles
├── server.js                # Express backend server with auth & task routes
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

   Configure your SMTP email credentials in `.env` (e.g. Gmail App Password, Mailtrap, or Brevo):
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/todolist_pbl
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   EMAIL_FROM=Modern To-Do <no-reply@moderntodo.com>
   ```

4. Run the automated test suite:
   ```bash
   npm test
   ```

5. Start the backend server:
   ```bash
   npm start
   ```

6. In a separate terminal, start the Vite development server:
   ```bash
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`.
