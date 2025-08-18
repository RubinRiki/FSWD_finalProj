import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MdArrowBack, MdEdit, MdDelete } from 'react-icons/md';
import {
  getAssignment,
  getSubmissions,
  bulkUpdateSubmissions,
  openSubmissionFile,
  downloadSubmissionFile,
  updateAssignment,
  deleteAssignment
} from '../services/AssignmentApi';
import { confirm, success, error as alertError, toast } from '../utils/alerts';
import { getRowFileTarget, dueInfo } from '../utils/helpers';
import './Assignment.css';

export default function Assignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [info, setInfo] = useState(state?.assignment || null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => { load(); }, [assignmentId]);

  async function load() {
    setLoading(true); setErr('');
    try {
      const [aRes, sRes] = await Promise.all([
        getAssignment(assignmentId, { fields: '_id,courseId,title,description,dueDate,createdAt', include: 'course' }),
        getSubmissions(assignmentId)
      ]);
      const a = aRes?.data || aRes || null;
      const subs = Array.isArray(sRes?.data) ? sRes.data : Array.isArray(sRes) ? sRes : [];
      setInfo(a);
      setRows(subs);
      setDraft({});
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Not found');
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    const d = {};
    rows.forEach(r => { d[r._id] = { grade: r.grade ?? '', note: r.note ?? '' }; });
    setDraft(d); setEditing(true);
  }

  function cancelEdit() {
    setEditing(false); setDraft({});
  }

  function updateCell(id, key, val) {
    setDraft(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));
  }

  const pendingUpdates = useMemo(() => {
    if (!editing) return [];
    return rows.map(r => {
      const d = draft[r._id] || {};
      const gradeChanged = String(d.grade ?? '') !== String(r.grade ?? '');
      const noteChanged = String(d.note ?? '') !== String(r.note ?? '');
      if (!gradeChanged && !noteChanged) return null;
      return { _id: r._id, grade: d.grade === '' ? null : d.grade, note: d.note ?? '' };
    }).filter(Boolean);
  }, [editing, rows, draft]);

  async function saveAll() {
    if (pendingUpdates.length === 0) { toast('No changes to save'); return; }
    const ok = await confirm({ title: 'Save grades', text: `Save ${pendingUpdates.length} changes?` });
    if (!ok.isConfirmed) return;
    try { await bulkUpdateSubmissions(assignmentId, pendingUpdates); success('Saved'); setEditing(false); await load(); }
    catch (e) { alertError('Save failed', e?.response?.data?.error || e?.message || 'Save failed'); }
  }

  function handleView(r) {
    const target = getRowFileTarget(r);
    if (!target) { toast('No file attached'); return; }
    if (target.type === 'url') window.open(target.value, '_blank', 'noopener,noreferrer');
    else openSubmissionFile(target.value);
  }

  function handleDownload(r) {
    const target = getRowFileTarget(r);
    if (!target) { toast('No file attached'); return; }
    if (target.type === 'url') {
      const a = document.createElement('a');
      a.href = target.value; a.target = '_blank'; a.rel = 'noopener'; a.click();
    } else {
      downloadSubmissionFile(target.value);
    }
  }

  async function onEditAssignment() {
    const { promptAssignment } = await import('../utils/helpers');
    const payload = await promptAssignment({
      title: info?.title || '',
      dueDate: info?.dueDate,
      description: info?.description || ''
    });
    if (!payload) return;
    try {
      await updateAssignment(assignmentId, payload);
      await load();
      success('Assignment updated');
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Update failed';
      alertError('Action failed', msg);
    }
  }

  async function onDeleteAssignment() {
    const ok = await confirm({ title: 'Delete assignment?', text: 'This may be blocked if submissions exist.' });
    if (!ok.isConfirmed) return;
    try {
      await deleteAssignment(assignmentId);
      toast({ icon: 'success', title: 'Assignment deleted' });
      const cid = state?.course?._id || info?.courseId;
      if (cid) navigate(`/courses/${cid}`); else navigate(-1);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Delete failed';
      alertError('Delete failed', msg);
    }
  }

  const due = dueInfo(info?.dueDate);

  return (
    <div className="as">
      <div className="as-topbar">
        <button className="as-back" onClick={() => navigate(-1)}>
          <MdArrowBack size={18} /> Back
        </button>
        <div className="as-title">{info?.title || 'Assignment'}</div>
        <div className="as-actions" />
      </div>

      {info && (
        <div className="as-assignment-card">
          <div className="as-card-actions">
            <button className="as-iconbtn" aria-label="Edit assignment" onClick={onEditAssignment}><MdEdit size={16} color='var(--as-text)' /></button>
            <button className="as-iconbtn danger" aria-label="Delete assignment" onClick={onDeleteAssignment}><MdDelete size={16} color='var(--as-text)' /></button>
          </div>

          <div className="as-assignment-title">{info.title}</div>
          <div className="as-assignment-meta">
            <div className="as-meta-row">
              <span className="as-meta-label">Course ID</span>
              <span className="as-meta-value">{String(info.courseId || '-')}</span>
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Title</span>
              <span className="as-meta-value">{info.title}</span>
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Description</span>
              <span className="as-meta-value">{info.description || '-'}</span>
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Due date</span>
              <span className="as-meta-value">
                {info.dueDate ? new Date(info.dueDate).toLocaleString() : '-'}
              </span>
              {due && <span className={`as-badge ${due.status}`}>{due.label}</span>}
              {due && <span className="as-due-when">{due.when}</span>}
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Created at</span>
              <span className="as-meta-value">
                {info.createdAt ? new Date(info.createdAt).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="as-cta-row">
        {!editing ? (
          <button className="as-btn primary sm" onClick={startEdit} disabled={loading || !!err}>Enter grading</button>
        ) : (
          <div className="as-cta-group">
            <button className="as-btn primary sm" onClick={saveAll} disabled={pendingUpdates.length === 0}>Save changes</button>
            <button className="as-btn sm" onClick={cancelEdit}>Cancel</button>
          </div>
        )}
      </div>

      <div className="as-panel">
        {loading && (
          <div className="as-notice">
            <div className="as-spinner" aria-hidden />
            <span>Loading…</span>
          </div>
        )}
        {!loading && err && (
          <div className="as-notice error">
            <span>{err}</span>
            <button className="as-btn" onClick={load}>Retry</button>
          </div>
        )}
        {!loading && !err && rows.length === 0 && (
          <div className="as-notice empty">No submissions yet.</div>
        )}
        {!loading && !err && rows.length > 0 && (
          <>
            <div className="as-table as-header">
              <div>Student</div>
              <div className="as-col-email">Email</div>
              <div className="as-col-grade">Grade</div>
              <div className="as-col-note">Notes</div>
              <div className="as-col-action"></div>
            </div>
            <ul className="as-list">
              {rows.map(r => {
                const d = draft[r._id] || {};
                return (
                  <li key={r._id} className="as-row">
                    <div className="as-cell student">
                      <div className="as-name">{r.student?.name || 'Student'}</div>
                    </div>
                    <div className="as-cell as-col-email">{r.student?.email || '-'}</div>
                    <div className="as-cell as-col-grade">
                      {!editing ? (
                        <span className="as-chip">{r.grade ?? '-'}</span>
                      ) : (
                        <input
                          type="number"
                          className="as-input as-input-number"
                          value={d.grade ?? ''}
                          min="0"
                          max="100"
                          step="0.5"
                          onChange={(e) => updateCell(r._id, 'grade', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      )}
                    </div>
                    <div className="as-cell as-col-note">
                      {!editing ? (
                        <span className="as-note">{r.note || '-'}</span>
                      ) : (
                        <input
                          type="text"
                          className="as-input"
                          value={d.note ?? ''}
                          onChange={(e) => updateCell(r._id, 'note', e.target.value)}
                          placeholder="Add note"
                        />
                      )}
                    </div>
                    <div className="as-cell as-col-action">
                      <button className="as-btn outline" onClick={() => handleView(r)}>View</button>
                      <button className="as-btn primary" onClick={() => handleDownload(r)}>Download</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
