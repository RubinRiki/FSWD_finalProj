import api from './api';

/** List my courses (teacher: courses I own; student: courses I'm enrolled in) */
export const listMyCourses = (params = {}) =>
  api.get('/courses/list', { params: { sort: '-createdAt', ...params } }).then(r => r.data);

/** Create / Update / Delete course (server enforces teacher-only) */
export const createCourse = (payload) =>
  api.post('/courses', payload).then(r => r.data);

export const updateCourse = (id, payload) =>
  api.patch(`/courses/${id}`, payload).then(r => r.data);

export const deleteCourse = (id) =>
  api.delete(`/courses/${id}`).then(r => r.data);

/** Single course (optional: include stats from server) */
export const getCourse = (id, params = {}) =>
  api.get(`/courses/${id}`, { params: { include: 'stats', ...params } }).then(r => r.data);

/** Assignments of a course */
export const getAssignments = (courseId, params = {}) =>
  api.get('/assignments', { params: { course: courseId, sort: '-createdAt', ...params } }).then(r => r.data);

/** Students of a course (server enforces teacher ownership) */
export const getStudents = (courseId, params = {}) =>
  api.get(`/courses/${courseId}/students`, { params }).then(r => r.data);
