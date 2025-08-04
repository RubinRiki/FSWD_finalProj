import axios from 'axios';

// Base axios instance with baseURL to your backend server
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // TODO: Use environment variable in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// === Example API calls ===

// Get all examples
export const getExamples = async () => {
  const response = await api.get('/example');
  return response.data;
};

// === Auth API calls ===

// Login user
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;  // should return token and user data
};

// Register user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Export the axios instance for other uses (e.g. with interceptors)
export default api;
