import api from './api';

export const getTeachingCourses = async () => {
  const res = await api.get('/courses/teaching'); 
  return res.data; 
}
