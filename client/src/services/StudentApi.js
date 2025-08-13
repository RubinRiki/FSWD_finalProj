// src/services/StudentApi.js
import api from './api';

// קבלת פרטי קורס מסוים
export const getCourseDetails = (courseId) =>
  api
    .get(`/courses/${courseId}/details`, { params: { include: 'stats' } })
    .then((res) => res.data);

// קבלת כל המטלות של הסטודנט בקורס מסוים
export const getStudentAssignments = (courseId, params = {}) =>
  api
    .get('/assignments', {
      params: { course: courseId, sort: '-createdAt', ...params },
    })
    .then((res) => res.data);

// קבלת כל ההגשות של הסטודנט במטלה מסוימת
export const getStudentSubmissions = (assignmentId, params = {}) =>
  api
    .get('/submissions', {
      params: { assignment: assignmentId, sort: '-createdAt', ...params },
    })
    .then((res) => res.data);

// קבלת כל הקורסים שהסטודנט רשום אליהם
export const getEnrolledCourses = (params = {}) =>
  api
    .get('/enrollments', { params })
    .then((res) => res.data);
