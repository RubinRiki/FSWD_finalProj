import api from './api';

// Get details of a specific course
export const getCourseDetails = (courseId) =>
  api
    .get(`/courses/${courseId}/details`, { params: { include: 'stats' } })
    .then((res) => res.data);

// Get assignments of the student in a specific course
export const getStudentAssignments = (courseId, params = {}) =>
  api
    .get('/assignments', {
      params: { course: courseId, sort: '-createdAt', ...params },
    })
    .then((res) => res.data);

// Get submissions of the student for a specific assignment
export const getStudentSubmissions = (assignmentId, params = {}) =>
  api
    .get('/submissions', {
      params: { assignment: assignmentId, sort: '-createdAt', ...params },
    })
    .then((res) => res.data);

// Get all courses the student is enrolled in (server resolves by role)
export const getMyCourses = (params = {}) =>
  api
    .get('/courses/list', { params })
    .then((res) => res.data);
