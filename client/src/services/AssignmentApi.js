import api from './api';

export const createAssignment = (courseId, payload) =>
  api.post('/assignments', { courseId, ...payload }).then(r => r.data);

export const updateAssignment = (id, payload) =>
  api.patch(`/assignments/${id}`, payload).then(r => r.data);

export const deleteAssignment = (id) =>
  api.delete(`/assignments/${id}`).then(r => r.data);

export const getAssignment = (id, params = {}) =>
  api.get(`/assignments/${id}`, { params: { include: 'course,stats', ...params } }).then(r => r.data);

export const getSubmissions = (assignmentId, params = {}) =>
  api.get('/submissions', {
    params: { assignment: assignmentId, sort: '-submittedAt', ...params }
  }).then(r => r.data);

export const bulkUpdateSubmissions = (assignmentId, updates) =>
  api.patch('/submissions/bulk', { assignment: assignmentId, updates }).then(r => r.data);

export const openSubmissionFile = async (id) => {
  const res = await api.get(`/submissions/${id}/file`, {
    params: { disposition: 'inline' },
    responseType: 'blob'
  });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export const downloadSubmissionFile = async (id) => {
  const res = await api.get(`/submissions/${id}/file`, {
    params: { disposition: 'attachment' },
    responseType: 'blob'
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'submission';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
