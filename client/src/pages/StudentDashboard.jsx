// src/pages/StudentDashboard.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { MdRefresh, MdLogout, MdCalendarToday } from 'react-icons/md';
import CourseCard from '../components/CourseCard';
import { AuthContext } from '../context/AuthContext';
import { getMyCourses, getStudentAssignments } from '../services/StudentApi';
import { confirm, error as alertError } from '../utils/alerts';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const studentName = user?.name || 'Student';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Weekly assignments
  const [weekly, setWeekly] = useState({ loading: false, error: '', items: [] });

  // match TeacherDashboard controls
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState('-createdAt');

  const weekToISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await getMyCourses({ limit: 1000, sort: '-createdAt' });
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setCourses(list);

      // Fetch weekly assignments once using the same list
      setWeekly({ loading: true, error: '', items: [] });
      const ids = list.map(c => c._id || c.id).filter(Boolean);
      if (ids.length === 0) {
        setWeekly({ loading: false, error: '', items: [] });
      } else {
        const results = await Promise.allSettled(
          ids.map((id, idx) => getStudentAssignments(id, { dueTo: weekToISO, sort: 'dueDate', limit: 50 }))
        );
        const items = [];
        results.forEach((res, idx) => {
          const course = list[idx];
          if (res.status === 'fulfilled' && Array.isArray(res.value)) {
            res.value.forEach((a) => {
              if (!a?.dueDate) return;
              items.push({
                id: a._id || a.id,
                title: a.title || 'Untitled assignment',
                dueDate: a.dueDate,
                courseTitle: course?.title || course?.name || 'Course',
              });
            });
          }
        });
        items.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
        setWeekly({ loading: false, error: '', items: items.slice(0, 6) });
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load data';
      setErr(msg);
      alertError('Load error', msg);
      setWeekly({ loading: false, error: msg, items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const setSortSafe = (v) => setSort(v);

  const handleLogout = async () => {
    const res = await confirm({
      title: 'Log out?',
      text: 'You will be returned to the login screen.',
      confirmButtonText: 'Log out',
    });
    if (res?.isConfirmed || res === true) logout();
  };

  return (
    <div className="td-container">
      <header className="td-header">
        <h1 className="td-title">Hello, {studentName}</h1>
        <div className="td-header-actions">
          <button className="td-btn" onClick={handleLogout}>
            <MdLogout size={18} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {/* Weekly assignments (non-blocking header section) */}
      <section className="td-panel" aria-live="polite">
        <h2 className="td-section-title">
          <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
            <MdCalendarToday size={16} /> Assignments Due This Week
          </span>
        </h2>
        {weekly.loading ? (
          <div className="td-notice">
            <div className="td-spinner" aria-hidden />
            <div>Loading assignments…</div>
          </div>
        ) : weekly.error ? (
          <div className="td-notice empty">
            <span>Could not load weekly assignments.</span>
            <button className="td-btn" onClick={loadAll} style={{marginInlineStart:8}}>
              <MdRefresh size={16} />
              <span>Retry</span>
            </button>
          </div>
        ) : weekly.items.length === 0 ? (
          <div className="td-notice empty">No assignments due this week.</div>
        ) : (
          <ul className="td-list">
            {weekly.items.map((a) => (
              <li key={a.id} className="td-row">
                <div className="td-row-main">
                  <div className="td-row-title">{a.title}</div>
                  <div className="td-row-sub">
                    <span>{a.courseTitle}</span>
                    <span>·</span>
                    <span>Deadline: {new Date(a.dueDate).toLocaleString('en-US')}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
          <button className={sort === '-createdAt' ? 'active' : ''} onClick={() => setSortSafe('-createdAt')} aria-pressed={sort === '-createdAt'}>Newest</button>
          <button className={sort === 'createdAt' ? 'active' : ''} onClick={() => setSortSafe('createdAt')} aria-pressed={sort === 'createdAt'}>Oldest</button>
          <button className={sort === 'title' ? 'active' : ''} onClick={() => setSortSafe('title')} aria-pressed={sort === 'title'}>A→Z</button>
          <button className={sort === '-title' ? 'active' : ''} onClick={() => setSortSafe('-title')} aria-pressed={sort === '-title'}>Z→A</button>
        </div>
        <select className="td-limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} aria-label="Items per page">
          <option value={6}>6</option><option value={12}>12</option><option value={24}>24</option><option value={48}>48</option>
        </select>
      </div>

      {loading && (
        <div className="td-panel td-notice">
          <div className="td-spinner" aria-hidden />
          <div>Loading courses…</div>
        </div>
      )}

      {!loading && err && (
        <div className="td-panel td-notice error" role="alert">
          <div>{err}</div>
          <button className="td-btn" onClick={loadAll}>
            <MdRefresh size={16} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {!loading && !err && (
        courses.length === 0 ? (
        <div className="td-panel td-notice empty">
            {q ? <>No matches for “{q}”.</> : <>No courses yet.</>}
        </div>
        ) : (
          <section className="td-panel">
            <h2 className="td-section-title">My Courses</h2>
            <div className="td-grid">
              {courses
                .filter(c => (q ? (c.title || '').toLowerCase().includes(q.toLowerCase()) : true))
                .sort((a,b) => {
                  const dir = sort.startsWith('-') ? -1 : 1;
                  const field = sort.replace('-', '');
                  if (field === 'title') {
                    const av = (a.title || '').toLowerCase();
                    const bv = (b.title || '').toLowerCase();
                    return av < bv ? -1*dir : av > bv ? 1*dir : 0;
                  }
                  const av = new Date(a.createdAt || 0).getTime();
                  const bv = new Date(b.createdAt || 0).getTime();
                  return (av - bv) * dir;
                })
                .slice(0, limit)
                .map((c) => (
                  <CourseCard key={c._id || c.id} course={{ ...c, assignmentsCount: c.count ?? c.assignmentsCount ?? 0 }} />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
