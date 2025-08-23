import axios from 'axios';

// חירום: מצביע ישירות לשרת dev
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let handling401 = false;
api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401 && !handling401) {
      handling401 = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
