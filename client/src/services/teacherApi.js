import api from './api';

export const getTeachingCourses = async () => {
  const token = localStorage.getItem('token');
  const res = await api.get('/courses/teaching', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
