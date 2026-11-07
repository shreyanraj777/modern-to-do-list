// utils/taskHelpers.js - Business logic for points scoring, overdue checks, and streak calculation

// Evaluates the completion outcome, overdue status, and point awards for a task.
export const evaluateTaskOutcome = (task) => {
  const now = new Date();

  if (task.completed) {
    if (!task.deadline) {
      return {
        completedOnTime: true,
        pointsAwarded: 30,
        isOverdue: false,
      };
    }

    const completionTime = task.completedAt ? new Date(task.completedAt) : now;
    const deadlineTime = new Date(task.deadline);

    if (completionTime <= deadlineTime) {
      return {
        completedOnTime: true,
        pointsAwarded: 30,
        isOverdue: false,
      };
    }

    return {
      completedOnTime: false,
      pointsAwarded: -50,
      isOverdue: true,
    };
  }

  if (task.deadline && now > new Date(task.deadline)) {
    return {
      completedOnTime: false,
      pointsAwarded: -50,
      isOverdue: true,
    };
  }

  return {
    completedOnTime: null,
    pointsAwarded: 0,
    isOverdue: false,
  };
};

// Formats a date object to local YYYY-MM-DD string.
export const formatLocalDate = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculates the consecutive daily productive streak based on task completion records.
export const calculateStreak = (tasks) => {
  const now = new Date();

  // Helper function to identify incomplete overdue tasks that break the streak.
  const isOverdueIncomplete = (task) => {
    if (task.completed) {
      return false;
    }
    if (!task.deadline) {
      return false;
    }
    return new Date(task.deadline) < now;
  };

  const hasOverdueTasks = tasks.some(isOverdueIncomplete);

  if (hasOverdueTasks) {
    return 0;
  }

  // Helper function to filter tasks that have valid completion timestamps.
  const isCompletedWithDate = (task) => {
    return Boolean(task.completed && task.completedAt);
  };

  const completedTasks = tasks.filter(isCompletedWithDate);

  if (completedTasks.length === 0) {
    return 0;
  }

  // Helper function to extract local date string from task completion timestamp.
  const getCompletionDateStr = (task) => {
    return formatLocalDate(task.completedAt);
  };

  const completedDateStrings = completedTasks.map(getCompletionDateStr);
  const completedDates = new Set(completedDateStrings);

  const todayStr = formatLocalDate(now);
  const yesterdayObj = new Date(now);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatLocalDate(yesterdayObj);

  let streak = 0;
  let checkDate = new Date(now);

  if (completedDates.has(todayStr)) {
    while (true) {
      const dateStr = formatLocalDate(checkDate);
      if (completedDates.has(dateStr)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  if (completedDates.has(yesterdayStr)) {
    checkDate = yesterdayObj;
    while (true) {
      const dateStr = formatLocalDate(checkDate);
      if (completedDates.has(dateStr)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  return 0;
};

// Computes summary metrics across all tasks including counts, points balance, and streak.
export const calculateStats = (tasks) => {
  const now = new Date();

  // Helper function to check if task is completed.
  const isCompleted = (task) => {
    return Boolean(task.completed);
  };

  // Helper function to check if task is incomplete and overdue.
  const isOverdue = (task) => {
    if (task.completed) {
      return false;
    }
    if (!task.deadline) {
      return false;
    }
    return new Date(task.deadline) < now;
  };

  // Helper function to sum points across tasks.
  const sumPoints = (accumulator, task) => {
    return accumulator + (task.pointsAwarded || 0);
  };

  const total = tasks.length;
  const completed = tasks.filter(isCompleted).length;
  const overdue = tasks.filter(isOverdue).length;
  const pending = total - completed;
  const points = tasks.reduce(sumPoints, 0);
  const streakCount = calculateStreak(tasks);
  const streakLabel = `${streakCount} ${streakCount === 1 ? 'Day' : 'Days'}`;

  return {
    total,
    completed,
    pending,
    overdue,
    points,
    streak: streakLabel,
    streakCount,
  };
};
