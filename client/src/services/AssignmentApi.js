import api from './api';

// Create / Update / Delete
export const createAssignment = (courseId, payload) =>
  api.post('/assignments', { courseId, ...payload }).then(r => r.data);

export const updateAssignment = (id, payload) =>
  api.patch(`/assignments/${id}`, payload).then(r => r.data);

export const deleteAssignment = (id) =>
  api.delete(`/assignments/${id}`).then(r => r.data);

// Read single assignment (server controls projection/expansions)
export const getAssignment = (id, params = {}) =>
  api.get(`/assignments/${id}`, { params: { include: 'course,stats', ...params } }).then(r => r.data);

// LIST submissions for an assignment
// TEACHER: all submissions (server will authorize & allow all)
// STUDENT: own submissions only (server scopes by JWT)
const listSubmissions = (assignmentId, params = {}) =>
  api.get('/submissions', {
    params: { assignment: assignmentId, sort: '-submittedAt', ...params }
  }).then(r => r.data);

export const getSubmissions   = (assignmentId) => listSubmissions(assignmentId); // teacher
export const getMySubmissions = (assignmentId) => listSubmissions(assignmentId); // student

// Bulk grade updates (teacher)
export const bulkUpdateSubmissions = (assignmentId, updates) =>
  api.patch('/submissions/bulk', { assignment: assignmentId, updates }).then(r => r.data);

// File view/download helpers
export const openSubmissionFile = async (id) => {
  const res = await api.get(`/submissions/${id}/file`, {
    params: { disposition: 'inline' },
    responseType: 'blob'
  });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const downloadSubmissionFile = async (id) => {
  const res = await api.get(`/submissions/${id}/file`, {
    params: { disposition: 'attachment' },
    responseType: 'blob'
  });
  const cd = res.headers?.['content-disposition'] || '';
  const m = cd.match(/filename="?([^"]+)"?/i);
  const filename = m?.[1] || 'submission';

  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
