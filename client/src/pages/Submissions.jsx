import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { getSubmissions, bulkUpdateSubmissions, openSubmissionFile, downloadSubmissionFile } from '../services/submissionsApi';
import { confirm, success, error as alertError, toast } from '../utils/alerts';
import './Submissions.css';

export default function Submissions() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => { load(); }, [assignmentId]);

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const res = await getSubmissions(assignmentId);
      const data =
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res : [];
      setRows(data);
      setDraft({});
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load submissions';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  function startEdit() {
    const d = {};
    rows.forEach(r => { d[r._id] = { grade: r.grade ?? '', note: r.note ?? '' }; });
    setDraft(d);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft({});
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
    if (pendingUpdates.length === 0) {
      toast('No changes to save');
      return;
    }
    const ok = await confirm({ title: 'Save grades', text: `Save ${pendingUpdates.length} changes?` });
    if (!ok.isConfirmed) return;
    try {
      await bulkUpdateSubmissions(assignmentId, pendingUpdates);
      success('Saved');
      setEditing(false);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Save failed';
      alertError('Save failed', msg);
    }
  }

  function rowHasFile(r) {
    return Boolean(
      (typeof r?.fileUrl === 'string' && r.fileUrl.trim() !== '') ||
      r?.fileId ||
      (Array.isArray(r?.files) && r.files.length > 0) ||
      r?.hasFile
    );
  }

  function handleView(r) {
    if (!rowHasFile(r)) { toast('No file attached'); return; }
    openSubmissionFile(r._id);
  }

  function handleDownload(r) {
    if (!rowHasFile(r)) { toast('No file attached'); return; }
    downloadSubmissionFile(r._id);
  }

  return (
    <div className="as">
      <div className="as-topbar">
        <button className="as-back" onClick={() => navigate(-1)}>
          <MdArrowBack size={18} /> Back
        </button>
        <div className="as-title">Submissions</div>
        <div className="as-actions">
          {!editing ? (
            <button className="as-btn primary" onClick={startEdit} disabled={loading || !!err}>Enter grading</button>
          ) : (
            <>
              <button className="as-btn primary" onClick={saveAll} disabled={pendingUpdates.length === 0}>Save changes</button>
              <button className="as-btn" onClick={cancelEdit}>Cancel</button>
            </>
          )}
        </div>
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
                const hasFile = rowHasFile(r);
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
                      <button className="as-btn outline" disabled={!hasFile} onClick={() => handleView(r)}>View</button>
                      <button className="as-btn primary" disabled={!hasFile} onClick={() => handleDownload(r)}>Download</button>
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
