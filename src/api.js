// src/api.js - Frontend HTTP client for calling backend REST API endpoints

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

// Fetches the list of all tasks from the backend.
export const fetchTasksApi = async () => {
  const response = await fetch(`${API_BASE}/tasks`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks from server');
  }
  const data = await response.json();
  return data;
};

// Fetches aggregated dashboard statistics from the backend.
export const fetchStatsApi = async () => {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch stats from server');
  }
  const data = await response.json();
  return data;
};

// Creates a new task on the backend server.
export const createTaskApi = async (taskData) => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
  });
  if (!response.ok) {
    const errorData = await parseErrorJson(response);
    throw new Error(errorData.error || 'Failed to delete task');
  }
  const data = await response.json();
  return data;
};
