import api from './api';

// params: { limit, q, sort }  |  sort: '-createdAt' | 'createdAt' | 'title' | '-title'
export const getCoursesList = (params = {}) =>
  api.get('/courses/list', { params }).then(r => r.data);

export const createCourse = (payload) =>
  api.post('/courses', payload).then(r => r.data);