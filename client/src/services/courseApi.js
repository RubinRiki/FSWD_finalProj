import api from './api';

export const getCourse = (id) =>
  api.get(`/courses/${id}/details`, { params: { include: 'stats' } }).then(r => r.data);

export const getAssignments = (courseId, params = {}) =>
  api.get('/assignments', { params: { course: courseId, sort: '-createdAt', ...params } }).then(r => r.data);


export const getStudents = (courseId, params = {}) =>
  api.get('/enrollments', { params: { course: courseId, ...params } }).then(r => r.data);

export const updateCourse = (id, payload) =>
  api.patch(`/courses/${id}`, payload).then(r => r.data);

export const deleteCourse = (id) =>
  api.delete(`/courses/${id}`).then(r => r.data);

