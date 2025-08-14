import api from './api';

export const getSubmissions = (assignmentId, params = {}) =>
  api
    .get('/submissions', { params: { assignment: assignmentId, sort: '-submittedAt', ...params } })
    .then(r => r.data);

export const bulkUpdateSubmissions = (assignmentId, updates) =>
  api.patch('/submissions/bulk', { assignment: assignmentId, updates }).then(r => r.data);

export const openSubmissionFile = async (id) => {
  const res = await api.get(`/submissions/${id}/file?disposition=inline`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

export const downloadSubmissionFile = async (id) => {
  const res = await api.get(`/submissions/${id}/file?disposition=attachment`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'submission';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
