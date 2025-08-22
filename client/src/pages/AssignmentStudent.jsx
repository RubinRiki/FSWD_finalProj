// src/pages/AssignmentStudent.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';

import { AuthContext } from '../context/AuthContext';
import { getAssignment, getMySubmissions } from '../services/AssignmentApi';
import { createSubmission, deleteSubmission } from '../services/submissionsApi';

import { confirm, success, error as alertError } from '../utils/alerts';
import { dueInfo, viewFile, fileUrlFromRow } from '../utils/helpers';
import './Assignment.css';

function fileNameFromUrl(url) {
  if (!url) return 'SUBMISSION';
  try {
    const u = new URL(url);
    const base = (u.pathname.split('/').pop() || '').trim();
    return base || 'SUBMISSION';
  } catch {
    const base = (String(url).split('/').pop() || '').trim();
    return base || 'SUBMISSION';
  }
}

export default function AssignmentStudent() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [assignment, setAssignment] = useState(null);
  const [subs, setSubs] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => { load(); }, [assignmentId, user?._id]);

  async function load() {
    setLoading(true); setErr('');
    try {
      const [aRes, sRes] = await Promise.all([
        getAssignment(assignmentId),
        getMySubmissions(assignmentId)
      ]);
      setAssignment(aRes?.data || aRes || null);
      const mySubs = Array.isArray(sRes?.data) ? sRes.data : (Array.isArray(sRes) ? sRes : []);
      setSubs(mySubs);
    } catch (e) {
      const msg = e?.response?.status === 403 ? 'You are not allowed to view this assignment.' :
                  e?.response?.data?.error || e?.message || 'Failed to load';
      setErr(msg);
    } finally { setLoading(false); }
  }

  async function handleUpload() {
    if (!file) return;
    try {
      await createSubmission(assignmentId, file);
      setFile(null);
      await load();
    } catch (e) {
      alertError('Upload failed', e?.response?.data?.error || e?.message || 'Upload failed');
    }
  }

  async function handleDelete(id) {
    const ok = await confirm({ title: 'Delete submission?', text: 'This action cannot be undone.' });
    if (!ok.isConfirmed) return;
    try {
      await deleteSubmission(id);
      success('Submission deleted');
      await load();
    } catch (e) {
      alertError('Delete failed', e?.response?.data?.error || e?.message || 'Delete failed');
    }
  }

  const due = dueInfo(assignment?.dueDate);
  const isClosed = due?.status === 'closed';
  const hasSubmission = subs.length > 0;

  return (
    <div className="as">
      <div className="as-topbar">
        <button className="as-back" onClick={() => navigate(-1)}><MdArrowBack size={18}/> Back</button>
        <div className="as-title">{assignment?.title || 'Assignment'}</div>
        <div />
      </div>

      {assignment && (
        <div className="as-assignment-card">
          <div className="as-assignment-title">{assignment.title}</div>
          <div className="as-assignment-meta">
            <div className="as-meta-row">
              <span className="as-meta-label">Description</span>
              <span className="as-meta-value">{assignment.description || '-'}</span>
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Due date</span>
              <span className="as-meta-value">
                {assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : '-'}
              </span>
              {due && <span className={`as-badge ${due.status}`}>{due.label}</span>}
              {due && <span className="as-due-when">{due.when}</span>}
            </div>
            <div className="as-meta-row">
              <span className="as-meta-label">Created at</span>
              <span className="as-meta-value">
                {assignment.createdAt ? new Date(assignment.createdAt).toLocaleString() : '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="as-panel" style={{ marginTop: 8 }}>
        <h3 className="as-h3">My submissions</h3>

        {loading && <div className="as-notice"><div className="as-spinner" aria-hidden/><span>Loading…</span></div>}
        {!loading && err && <div className="as-notice error"><span>{err}</span><button className="as-btn" onClick={load}>Retry</button></div>}
        {!loading && !err && subs.length === 0 && <div className="as-notice empty">No submissions yet.</div>}

        {!loading && !err && subs.length > 0 && (
          <>
            <div className="as-table as-header">
              <div>File name</div>
              <div className="as-col-submitted">Submitted at</div>
              <div className="as-col-grade">Grade</div>
              <div className="as-col-note">Notes</div>
              <div className="as-col-action"></div>
            </div>
            <ul className="as-list">
              {subs.map(s => {
                const url = fileUrlFromRow(s);
                const hasFile = !!url;
                const name = s.fileName || fileNameFromUrl(url);
                return (
                  <li key={s._id} className="as-row">
                    <div className="as-cell"><div className="as-name">{name}</div></div>
                    <div className="as-cell as-col-submitted">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}
                    </div>
                    <div className="as-cell as-col-grade"><span className="as-chip">{s.grade ?? 'Pending'}</span></div>
                    <div className="as-cell as-col-note"><span className="as-note">{s.note || '-'}</span></div>
                    <div className="as-cell as-col-action">
                      <button className="as-btn outline" onClick={() => viewFile(s)} disabled={!hasFile}>View</button>
                      <button className="as-btn danger" onClick={() => handleDelete(s._id)}>Delete</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Upload panel: hidden if there is already a submission.
          Still shows a warning if window is closed. */}
      {!loading && isClosed && (
        <div className="as-panel" style={{ marginTop: 8 }}>
          <h3 className="as-h3">Upload new submission</h3>
          <div className="as-notice warn">Submission window is closed.</div>
        </div>
      )}

      {!loading && !isClosed && !hasSubmission && (
        <div className="as-panel" style={{ marginTop: 8 }}>
          <h3 className="as-h3">Upload new submission</h3>
          <div className="as-upload">
            <input
              type="file"
              className="as-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button className="as-btn primary" onClick={handleUpload} disabled={!file}>Upload</button>
          </div>
        </div>
      )}
    </div>
  );
}
