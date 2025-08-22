import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MdArrowBack, MdEdit, MdDelete } from 'react-icons/md';

import {
  getAssignment,
  getSubmissions,
  bulkUpdateSubmissions,
  updateAssignment,
  deleteAssignment
} from '../services/AssignmentApi';

import { confirm, success, error as alertError, toast } from '../utils/alerts';
import { dueInfo, viewFile, downloadFile, promptAssignment } from '../utils/helpers';
import './Assignment.css';

export default function Assignment() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [info, setInfo] = useState(state?.assignment || null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => { load(); }, [assignmentId]);

  async function load() {
    setLoading(true); setErr('');
    try {
      const [aRes, sRes] = await Promise.all([
        getAssignment(assignmentId),
        getSubmissions(assignmentId) // teacher: all submissions for this assignment
      ]);
      setInfo(aRes?.data || aRes || null);
      const subs = Array.isArray(sRes?.data) ? sRes.data : (Array.isArray(sRes) ? sRes : []);
      setRows(subs);
      setDraft({});
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Not found');
    } finally { setLoading(false); }
  }

  function startEdit() {
    const d = {};
    rows.forEach(r => { d[r._id] = { grade: r.grade ?? '', note: r.note ?? '' }; });
    setDraft(d); setEditing(true);
  }
  function cancelEdit() { setEditing(false); setDraft({}); }
  function updateCell(id, key, val) { setDraft(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } })); }

  const pendingUpdates = useMemo(() => {
    if (!editing) return [];
    return rows.map(r => {
      const d = draft[r._id] || {};
      const gChanged = String(d.grade ?? '') !== String(r.grade ?? '');
      const nChanged = String(d.note ?? '') !== String(r.note ?? '');
      if (!gChanged && !nChanged) return null;
      return { _id: r._id, grade: d.grade === '' ? null : d.grade, note: d.note ?? '' };
    }).filter(Boolean);
  }, [editing, rows, draft]);

  async function saveAll() {
    if (!pendingUpdates.length) { toast('No changes to save'); return; }
    const ok = await confirm({ title: 'Save grades', text: `Save ${pendingUpdates.length} changes?` });
    if (!ok.isConfirmed) return;
    try { await bulkUpdateSubmissions(assignmentId, pendingUpdates); success('Saved'); setEditing(false); await load(); }
    catch (e) { alertError('Save failed', e?.response?.data?.error || e?.message || 'Save failed'); }
  }

  async function onEditAssignment() {
    const payload = await promptAssignment({
      title: info?.title || '',
      dueDate: info?.dueDate,
      description: info?.description || ''
    });
    if (!payload) return;
    try { await updateAssignment(assignmentId, payload); await load(); success('Assignment updated'); }
    catch (e) { alertError('Action failed', e?.response?.data?.error || e?.message || 'Update failed'); }
  }

  async function onDeleteAssignment() {
    const ok = await confirm({ title: 'Delete assignment?', text: 'This may be blocked if submissions exist.' });
    if (!ok.isConfirmed) return;
    try {
      await deleteAssignment(assignmentId);
      success('Assignment deleted');
      const cid = state?.course?._id || info?.courseId;
      if (cid) navigate(`/courses/${cid}`); else navigate(-1);
    } catch (e) { alertError('Delete failed', e?.response?.data?.error || e?.message || 'Delete failed'); }
  }

  const due = dueInfo(info?.dueDate);

  return (
    <div className="as">
      <div className="as-topbar">
        <button className="as-back" onClick={() => navigate(-1)}><MdArrowBack size={18}/> Back</button>
        <div className="as-title">{info?.title || 'Assignment'}</div>
        <div className="as-actions">
  <button className="as-iconbtn" onClick={onEditAssignment} aria-label="Edit">
    <MdEdit />
    <span className="sr-only">Edit</span>
  </button>
  <button className="as-iconbtn danger" onClick={onDeleteAssignment} aria-label="Delete">
    <MdDelete />
    <span className="sr-only">Delete</span>
  </button>
</div>

      </div>

      {info && (
        <div className="as-assignment-card">
          <div className="as-assignment-title">{info.title}</div>
          <div className="as-assignment-meta">
            <div className="as-meta-row">
              <span className="as-meta-label">Description</span>
              <span className="as-meta-value">{info.description || '-'}</span>
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Due date</span>
              <span className="as-meta-value">{info.dueDate ? new Date(info.dueDate).toLocaleString() : '-'}</span>
              {due && <span className={`as-badge ${due.status}`}>{due.label}</span>}
              {due && <span className="as-due-when">{due.when}</span>}
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Created at</span>
              <span className="as-meta-value">{info.createdAt ? new Date(info.createdAt).toLocaleString() : '-'}</span>
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
        {loading && <div className="as-notice"><div className="as-spinner" aria-hidden /><span>Loading…</span></div>}
        {!loading && err && <div className="as-notice error"><span>{err}</span><button className="as-btn" onClick={load}>Retry</button></div>}
        {!loading && !err && rows.length === 0 && <div className="as-notice empty">No submissions yet.</div>}

        {!loading && !err && rows.length > 0 && (
          <>
            <div className="as-table as-header">
              <div>Student</div>
              <div className="as-col-submitted">Submitted at</div>
              <div className="as-col-grade">Grade</div>
              <div className="as-col-note">Notes</div>
              <div className="as-col-action"></div>
            </div>
            <ul className="as-list">
              {rows.map(r => {
                const d = draft[r._id] || {};
                return (
                  <li key={r._id} className="as-row">
                    <div className="as-cell"><div className="as-name">{r.student?.name || 'Student'}</div></div>
                    <div className="as-cell as-col-submitted">{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}</div>
                    <div className="as-cell as-col-grade">
                      {!editing ? <span className="as-chip">{r.grade ?? '-'}</span> : (
                        <input
                          type="number"
                          className="as-input as-input-number"
                          value={d.grade ?? ''}
                          min="0" max="100" step="0.5"
                          onChange={(e) => updateCell(r._id, 'grade', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      )}
                    </div>
                    <div className="as-cell as-col-note">
                      {!editing ? <span className="as-note">{r.note || '-'}</span> : (
                        <input type="text" className="as-input" value={d.note ?? ''} onChange={(e) => updateCell(r._id, 'note', e.target.value)} placeholder="Add note" />
                      )}
                    </div>
                    <div className="as-cell as-col-action">
                      <button className="as-btn outline" onClick={() => viewFile(r)}>View</button>
                      <button className="as-btn primary" onClick={() => downloadFile(r)}>Download</button>
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
