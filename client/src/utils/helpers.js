import { confirm ,formPrompt } from './alerts';


/* ---------- Time helpers ---------- */

/** Format a relative delta in ms into "in 2d 3h" / "45m ago". */
export function fmtRel(ms) {
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h) parts.push(h + 'h');
  if (!d && !h) parts.push(m + 'm');
  return ms >= 0 ? 'in ' + parts.join(' ') : parts.join(' ') + ' ago';
}

/** Build "due" info for chips/badges: status + label + relative "when". */
export function dueInfo(raw) {
  if (!raw) return null;
  const due = new Date(raw);
  if (Number.isNaN(due.getTime())) return null;
  const diff = due.getTime() - Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const status = diff < 0 ? 'closed' : diff <= week ? 'soon' : 'open';
  const label = status === 'closed' ? 'Closed' : status === 'soon' ? 'Due soon' : 'Open';
  return { status, label, when: fmtRel(diff) };
}

/** Convert ISO datetime to <input type="datetime-local"> value in local TZ. */
export function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

/* ---------- Submission/file helpers ---------- */

/** Normalize a file URL string; return '' when empty/"null"/"undefined". */
export function fileUrlFromRow(r) {
  const t = (r?.fileUrl ?? '').toString().trim();
  const low = t.toLowerCase();
  return t && low !== 'null' && low !== 'undefined' ? t : '';
}

/**
 * Choose how to open a submission file:
 * - If URL exists -> { type:'url', value:<url> }
 * - Else if row has _id -> { type:'id', value:<_id> } (use API open/download)
 * - Else -> null
 */
export function getRowFileTarget(r) {
  const url = fileUrlFromRow(r);
  if (url) return { type: 'url', value: url };
  if (r?._id) return { type: 'id', value: r._id };
  return null;
}

/* ---------- SweetAlert forms (course/assignment) ---------- */

function esc(s) {
  return (s ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** SweetAlert modal for editing a course (title + description). */
export async function promptCourseEdit(initial = {}) {
  const res = await confirm({
    title: 'Edit course',
    html: `
      <label class="swal2-label">Title</label>
      <input id="swal-title" class="swal2-input" value="${esc(initial.title)}" />
      <label class="swal2-label">Description</label>
      <textarea id="swal-desc" class="swal2-textarea">${esc(initial.description)}</textarea>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Save',
    preConfirm: () => {
      const title = document.getElementById('swal-title').value.trim();
      const description = document.getElementById('swal-desc').value.trim();
      if (!title) { window.Swal?.showValidationMessage?.('Title is required'); return false; }
      return { title, description };
    }
  });
  return res?.isConfirmed ? res.value : null;
}

export async function promptAssignment(initial = {}) {
  const values = await formPrompt({
    title: initial?._id ? 'Edit assignment' : 'New assignment',
    confirmText: 'Save',
    width: 420,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 100, value: initial.title || '' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3, maxLength: 500, value: initial.description || '' },
      { name: 'dueDate', label: 'Due (optional)', type: 'datetime-local', value: initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0,16) : '' }
    ],
  });
  if (!values) return null;
  const out = { title: values.title.trim(), description: values.description.trim() };
  if (values.dueDate) out.dueDate = new Date(values.dueDate).toISOString();
  return out;
}
