import api from './api';

export const listCatalog = (params = {}) =>
  api.get('/courses/catalog', { params }).then(r => r.data);

export const enrollCourse = (courseId) =>
  api.post(`/courses/${courseId}/enroll`).then(r => r.data);

export const requestEnroll = (courseId) =>
  api.post(`/courses/${courseId}/enroll/request`).then(r => r.data);

export const leaveCourse = (courseId) =>
  api.delete(`/courses/${courseId}/enroll`).then(r => r.data);

export const listPendingRequests = (params = {}) =>
  api.get('/enrollments/requests', { params }).then(r => r.data);

export const approveEnrollment = (enrollmentId) =>
  api.post(`/enrollments/${enrollmentId}/approve`).then(r => r.data);

export const rejectEnrollment = (enrollmentId) =>
  api.post(`/enrollments/${enrollmentId}/reject`).then(r => r.data);

export { listMyCourses } from './courseApi';
