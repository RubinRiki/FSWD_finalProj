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

// View file in a new tab (blob) – keeps Authorization via Axios
export async function openSubmissionFile(id) {
  const res = await api.get(`/submissions/${id}/file`, {
    responseType: 'blob',
    params: { disposition: 'inline' },
  });
const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
const url = URL.createObjectURL(blob);  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Download file with its server-provided filename
export async function downloadSubmissionFile(id) {
 const res = await api.get(`/submissions/${id}/file`, {
    responseType: 'blob',
    params: { disposition: 'attachment' },
  });
  const dispo = res.headers['content-disposition'] || '';
  const m = dispo.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const name = decodeURIComponent(m?.[1] || m?.[2] || 'submission');
 const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
}

