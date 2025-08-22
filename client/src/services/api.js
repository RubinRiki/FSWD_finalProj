import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || '/api'
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let handling401 = false;

api.interceptors.response.use(
  r => r,
  err => {
    const s = err?.response?.status;
    if (s === 401 && !handling401) {
      handling401 = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
