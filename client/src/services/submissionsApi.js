import api from './api';

// Upload (student only; server derives student from JWT)
export const createSubmission = (assignmentId, file, note = '') => {
  const form = new FormData();
  form.append('assignment', assignmentId);
  form.append('file', file);
  if (note) form.append('note', note);

  return api.post('/submissions/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

// Delete specific submission (owner student OR teacher owner-of-course)
export const deleteSubmission = (submissionId) =>
  api.delete(`/submissions/${submissionId}`).then(r => r.data);
