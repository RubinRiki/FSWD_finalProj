import React, { useEffect, useState, useContext } from 'react';
import { MdAddCircle, MdRefresh, MdLogout } from 'react-icons/md';
import CourseCard from '../components/CourseCard';
import { AuthContext } from '../context/AuthContext';
import { listMyCourses as getCoursesList, createCourse } from '../services/courseApi';
import { listPendingRequests, approveEnrollment, rejectEnrollment } from '../services/enrollmentApi';
import { confirm, toast, error, promptCourse } from '../utils/alerts';
import DataPanel from '../components/DataPanel';
import TabButton from '../components/TabButton';

import './TeacherDashboard.css';

function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const teacherName = user?.name || 'Teacher';

  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState('-createdAt');

  const [reqs, setReqs] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqErr, setReqErr] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await getCoursesList({ limit, q, sort });
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load courses';
      setErr(msg);
      error('Load error', msg);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setReqLoading(true);
    setReqErr('');
    try {
      const r = await listPendingRequests({ limit: 200 });
      const items = Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : []);
      setReqs(items);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load requests';
      setReqErr(msg);
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, [limit, q, sort]);
  useEffect(() => { if (tab === 'requests') loadRequests(); }, [tab]);

  const handleLogout = async () => {
    const res = await confirm({ title: 'Log out?', text: 'You will be returned to the login screen.', confirmButtonText: 'Log out' });
    if (res?.isConfirmed) logout();
  };

  const handleCreateClick = async () => {
    const values = await promptCourse();
    if (!values) return;
    try {
      await createCourse(values);
      await loadCourses();
      toast({ icon: 'success', title: 'Course created' });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to create course';
      error('Action failed', msg);
    }
  };

  const onApprove = async (id) => {
    try {
      await approveEnrollment(id);
      toast({ icon: 'success', title: 'Approved' });
      await Promise.all([loadRequests(), loadCourses()]);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Approve failed';
      error('Action failed', msg);
    }
  };

  const onReject = async (id) => {
    try {
      await rejectEnrollment(id);
      toast({ icon: 'success', title: 'Rejected' });
      await loadRequests();
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Reject failed';
      error('Action failed', msg);
    }
  };

  return (
    <div className="page-container">
      <div className="td-container">
        <header className="td-header">
          <h1 className="td-title">Hello, {teacherName}</h1>
          <div className="td-header-actions">
            <button className="td-btn primary" disabled={loading} onClick={handleCreateClick}>
              <MdAddCircle size={18} /><span>Create Course</span>
            </button>
            <button className="td-btn" onClick={handleLogout}>
              <MdLogout size={18} /><span>Log out</span>
            </button>
          </div>
        </header>

        <nav className="cd-tabs" role="tablist" style={{ marginTop: 10 }}>
          <TabButton
            id="tab-courses"
            controls="panel-courses"
            active={tab === 'courses'}
            onClick={() => setTab('courses')}
            label="COURSES"
          />
          <TabButton
            id="tab-requests"
            controls="panel-requests"
            active={tab === 'requests'}
            onClick={() => setTab('requests')}
            label="REQUESTS"
          />
        </nav>

        <div id="panel-courses" role="tabpanel" hidden={tab !== 'courses'}>
          <DataPanel
            state={{ loading, error: err, data: courses }}
            emptyText={q ? `No matches for “${q}”.` : 'No courses yet.'}
            onRetry={loadCourses}
          >
            <div className="td-filters">
              <div className="td-search">
                <input
                  type="search"
                  placeholder="Search courses…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search courses"
                />
              </div>
              <div className="td-sort">
                <button className={sort === '-createdAt' ? 'active' : ''} onClick={() => setSort('-createdAt')} aria-pressed={sort === '-createdAt'}>Newest</button>
                <button className={sort === 'createdAt' ? 'active' : ''} onClick={() => setSort('createdAt')} aria-pressed={sort === 'createdAt'}>Oldest</button>
                <button className={sort === 'title' ? 'active' : ''} onClick={() => setSort('title')} aria-pressed={sort === 'title'}>A→Z</button>
                <button className={sort === '-title' ? 'active' : ''} onClick={() => setSort('-title')} aria-pressed={sort === '-title'}>Z→A</button>
              </div>
              <select className="td-limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} aria-label="Items per page">
                <option value={6}>6</option><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option>
              </select>
            </div>

            <section className="td-panel">
              <h2 className="td-section-title">My Courses</h2>
              <div className="td-grid">
                {courses.map((c) => (
                  <CourseCard key={c._id} course={{ ...c, assignmentsCount: c.count ?? c.assignmentsCount ?? 0 }} />
                ))}
              </div>
            </section>
          </DataPanel>
        </div>

        <div id="panel-requests" role="tabpanel" hidden={tab !== 'requests'}>
          <DataPanel
            state={{ loading: reqLoading, error: reqErr, data: reqs }}
            emptyText="No pending requests."
            onRetry={loadRequests}
          >
            <section className="td-panel">
              <div className="td-panel-head">
                <h2 className="td-section-title">Pending Requests</h2>
                <button className="td-btn" onClick={loadRequests}><MdRefresh size={16} /><span>Refresh</span></button>
              </div>

              <div className="req-table">
                <div className="req-head">
                  <div className="req-col name">Student</div>
                  <div className="req-col email">Email</div>
                  <div className="req-col course">Course</div>
                  <div className="req-col actions">Actions</div>
                </div>
                {reqs.map(r => (
                  <div key={r._id} className="req-row">
                    <div className="req-col name">
                      <div className="req-person">
                        <div className="req-avatar">{initials(r.student?.name)}</div>
                        <div className="req-person-text">
                          <div className="req-name">{r.student?.name || 'Student'}</div>
                          <div className="req-meta">ID: {(r.student?._id || '').slice(-6)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="req-col email">{r.student?.email || ''}</div>
                    <div className="req-col course">{r.course?.title || 'Course'}</div>
                    <div className="req-col actions">
                      <button className="td-btn primary" onClick={() => onApprove(r._id)}>Approve</button>
                      <button className="td-btn danger" onClick={() => onReject(r._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </DataPanel>
        </div>
      </div>
    </div>
  );
}
