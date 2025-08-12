import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import 'sweetalert2/dist/sweetalert2.min.css';
import './alerts.css';

const S = withReactContent(Swal);

const classes = {
  popup: 'app-swal',
  title: 'app-swal-title',
  htmlContainer: 'app-swal-body',
  actions: 'app-swal-actions',
  confirmButton: 'app-btn app-btn-primary',
  cancelButton: 'app-btn app-btn-ghost',
};

const base = {
  confirmButtonColor: '#4f46e5',
  cancelButtonColor: '#64748b',
  buttonsStyling: true,
  reverseButtons: true,
  customClass: classes,
};

const toastMixin = S.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
});

export const confirm = (opts = {}) =>
  S.fire({
    ...base,
    icon: opts.icon || 'question',
    title: opts.title || 'Are you sure?',
    text: opts.text || '',
    showCancelButton: true,
    confirmButtonText: opts.confirmButtonText || 'Confirm',
    cancelButtonText: opts.cancelButtonText || 'Cancel',
    ...opts,
  });

export const toast = (opts = {}) =>
  toastMixin.fire({ icon: 'success', title: '', ...opts });

export const success = (title, text = '') =>
  S.fire({ ...base, position: 'top', icon: 'success', title, text });

export const error = (title, text = '') =>
  S.fire({ ...base, icon: 'error', title, text });

export const info = (title, text = '') =>
  S.fire({ ...base, icon: 'info', title, text });

const esc = (s = '') =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#039;');

const fieldHtml = (f) => {
  const id = `swal-${f.name}`;
  const common = `id="${id}" name="${f.name}" ${f.required ? 'required' : ''} ${f.maxLength ? `maxlength="${f.maxLength}"` : ''}`;
  const label = `<label class="swal2-label" for="${id}">${esc(f.label || f.name)}</label>`;
  const val = esc(f.value ?? '');
  if (f.type === 'textarea') {
    return `<div class="app-field">${label}<textarea class="swal2-textarea" ${common} rows="${f.rows || 4}">${val}</textarea></div>`;
  }
  if (f.type === 'select') {
    const opts = (f.options || [])
      .map(o => `<option value="${esc(o.value)}"${String(o.value)===String(f.value)?' selected':''}>${esc(o.label)}</option>`)
      .join('');
    return `<div class="app-field">${label}<select class="swal2-select" ${common}>${opts}</select></div>`;
  }
  const type = f.type || 'text';
  return `<div class="app-field">${label}<input class="swal2-input" type="${type}" ${common} value="${val}" placeholder="${esc(f.placeholder || '')}" /></div>`;
};

export const formPrompt = async ({
  title,
  fields = [],
  confirmText = 'Save',
  cancelText = 'Cancel',
  preValidate,
  width,
}) => {
  const html = fields.map(fieldHtml).join('');
    const res = await S.fire({
    ...base,
    customClass: { ...base.customClass, popup: `${base.customClass.popup} app-swal--form` },
    title: title || 'Form',
    html,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    width,
    preConfirm: async () => {
      const out = {};
      for (const f of fields) {
        const el = document.getElementById(`swal-${f.name}`);
        let v = f.type === 'number' ? Number(el.value) : el.value.trim();
        if (f.required && !v && v !== 0) {
          Swal.showValidationMessage(`${f.label || f.name} is required`);
          return false;
        }
        out[f.name] = v;
      }
      if (preValidate) {
        const msg = await preValidate(out);
        if (msg) {
          Swal.showValidationMessage(msg);
          return false;
        }
      }
      return out;
    },
  });
  if (!res.isConfirmed) return null;
  return res.value;
};

export const promptCourse = (defaults = {}) =>
  formPrompt({
    title: 'Create Course',
    confirmText: 'Create',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 100, value: defaults.title || '' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, maxLength: 500, value: defaults.description || '' },
    ],
  });

export default { confirm, toast, success, error, info, formPrompt, promptCourse };
