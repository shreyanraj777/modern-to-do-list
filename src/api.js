// src/api.js - Frontend HTTP client for calling backend REST API endpoints with cookie authentication
const API_BASE = '/api';

// Helper function to safely parse error response JSON.
const parseErrorJson = async (response) => {
  try {
    const data = await response.json();
    return data;
  } catch {
    return {};
  }
};

// ==========================================
// AUTHENTICATION API METHODS
// ==========================================

// Registers a new user account and requests email verification OTP.
export const registerApi = async (userData) => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    const err = new Error(errorData.error || 'Registration failed');
    err.code = errorData.code;
    throw err;
  }

  const data = await response.json();
  return data;
};

// Authenticates user credentials and triggers login OTP email dispatch.
export const loginApi = async (credentials) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    const err = new Error(errorData.error || 'Login failed');
    err.code = errorData.code;
    throw err;
  }

  const data = await response.json();
  return data;
};

// Verifies the 6-digit OTP code on the backend server to activate account or complete login.
export const verifyOtpApi = async (otpData) => {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(otpData),
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Verification failed');
  }

  const data = await response.json();
  return data;
};

// Requests a fresh OTP code respecting backend 60-second cooldown policy.
export const resendOtpApi = async (resendData) => {
  const response = await fetch(`${API_BASE}/auth/resend-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(resendData),
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    const err = new Error(errorData.error || 'Failed to resend code');
    err.code = errorData.code;
    throw err;
  }

  const data = await response.json();
  return data;
};

// Logs out the user on the backend and clears session cookies.
export const logoutApi = async () => {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Logout failed');
  }

  const data = await response.json();
  return data;
};

// Fetches the currently authenticated user session details from the backend.
export const fetchCurrentUserApi = async () => {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    const authError = new Error(errorData.error || 'Not authenticated');
    authError.status = response.status;
    throw authError;
  }

  const data = await response.json();
  return data;
};

// ==========================================
// TASK & DASHBOARD API METHODS
// ==========================================

// Fetches the list of all tasks belonging to the authenticated user from the backend.
export const fetchTasksApi = async () => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to fetch tasks from server');
  }

  const data = await response.json();
  return data;
};

// Fetches aggregated dashboard statistics from the backend.
export const fetchStatsApi = async () => {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to fetch stats from server');
  }

  const data = await response.json();
  return data;
};

// Creates a new task on the backend server for the authenticated user.
export const createTaskApi = async (taskData) => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to create task');
  }

  const data = await response.json();
  return data;
};

// Updates an existing task on the backend server.
export const updateTaskApi = async (id, taskData) => {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to update task');
  }

  const data = await response.json();
  return data;
};

// Toggles completion status of a task on the backend.
export const toggleTaskCompleteApi = async (id) => {
  const response = await fetch(`${API_BASE}/tasks/${id}/toggle`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to toggle task');
  }

  const data = await response.json();
  return data;
};

// Deletes a task by ID on the backend server.
export const deleteTaskApi = async (id) => {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to delete task');
  }

  const data = await response.json();
  return data;
};
