import React, { useEffect, useMemo, useState, useContext } from 'react';
import { MdRefresh, MdLogout, MdCalendarToday } from 'react-icons/md';
import CourseCard from '../components/CourseCard';
import { AuthContext } from '../context/AuthContext';

import {
  listMyCourses as getMyCourses,
  getAssignments as getStudentAssignments,
} from '../services/courseApi';

import {
  listCatalog,
  enrollCourse,
  requestEnroll,
} from '../services/enrollmentApi';

import { confirm, error as alertError, toast } from '../utils/alerts';

import './StudentDashboard.css';
import './CourseDetails.css';

export default function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const studentName = user?.name || 'Student';

  const [tab, setTab] = useState('my');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [catalog, setCatalog] = useState({ loading: false, error: '', items: [] });
  const [weekly, setWeekly] = useState({ loading: false, error: '', items: [] });
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState('-createdAt');

  const weekToISO = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString();
  }, []);

  const loadMine = async () => {
    setLoading(true); setErr('');
    try {
      const data = await getMyCourses({ limit: 1000, sort: '-createdAt' });
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setCourses(list);

      setWeekly({ loading: true, error: '', items: [] });
      const ids = list.map(c => c._id || c.id).filter(Boolean);
      if (ids.length === 0) {
        setWeekly({ loading: false, error: '', items: [] });
      } else {
        const results = await Promise.allSettled(
          ids.map((id) => getStudentAssignments(id, { dueTo: weekToISO, sort: 'dueDate', limit: 50 }))
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

  const loadCatalog = async () => {
    setCatalog(s => ({ ...s, loading: true, error: '' }));
    try {
      const params = { q, sort, limit: 48 };
      const data = await listCatalog(params);
      const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setCatalog({ loading: false, error: '', items });
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load catalog';
      setCatalog({ loading: false, error: msg, items: [] });
    }
  };

  useEffect(() => { loadMine(); }, []);
  useEffect(() => { if (tab === 'catalog') loadCatalog(); }, [tab, q, sort]);

  const setSortSafe = (v) => setSort(v);

  const handleLogout = async () => {
    const res = await confirm({
      title: 'Log out?',
      text: 'You will be returned to the login screen.',
      confirmButtonText: 'Log out',
    });
    if (res?.isConfirmed || res === true) logout();
  };

  const onEnroll = async (courseId) => {
    try {
      const r = await enrollCourse(courseId);
      const st = r?.data?.status || r?.status;
      if (st === 'approved') {
        toast({ icon: 'success', title: 'Joined the course' });
        await Promise.all([loadMine(), loadCatalog()]);
        setTab('my');
        return;
      }
      if (st === 'pending') {
        toast({ icon: 'success', title: 'Request sent' });
        await loadCatalog();
        return;
      }
      toast({ icon: 'success', title: 'Enrollment updated' });
      await Promise.all([loadMine(), loadCatalog()]);
    } catch (e) {
      try {
        await requestEnroll(courseId);
        toast({ icon: 'success', title: 'Request sent' });
        await loadCatalog();
      } catch (err) {
        alertError('Enroll failed', err?.response?.data?.error || err?.message || 'Enroll failed');
      }
    }
  };

  return (
    <div className="td-container">
      <header className="td-header">
        <h1 className="td-title">Hello, {studentName}</h1>
        <div className="td-header-actions">
          <button className="td-btn" onClick={handleLogout}>
            <MdLogout size={18} /><span>Log out</span>
          </button>
        </div>
      </header>

      {/* <section className="td-panel" aria-live="polite">
        <h2 className="td-section-title">
          <span style={{display:'inline-flex',alignItems:'center',gap:8}}>
            <MdCalendarToday size={16} /> Assignments Due This Week
          </span>
        </h2>
        {weekly.loading ? (
          <div className="td-notice"><div className="td-spinner" aria-hidden /><div>Loading assignments…</div></div>
        ) : weekly.error ? (
          <div className="td-notice empty">
            <span>Could not load weekly assignments.</span>
            <button className="td-btn" onClick={loadMine} style={{marginInlineStart:8}}>
              <MdRefresh size={16} /><span>Retry</span>
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
                    <span>{a.courseTitle}</span><span>·</span>
                    <span>Deadline: {new Date(a.dueDate).toLocaleString('en-US')}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section> */}

      <nav className="cd-tabs" role="tablist" aria-label="Student tabs" style={{marginTop:10}}>
        <TabButton active={tab === 'my'} onClick={() => setTab('my')} label="MY COURSES" />
        <TabButton active={tab === 'catalog'} onClick={() => setTab('catalog')} label="ALL COURSES" />
      </nav>

      <div className="cd-panel">
        <div className="td-filters" style={{marginBottom:10}}>
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

        {tab === 'my' && (
          <>
            {loading ? (
              <div className="td-notice"><div className="td-spinner" aria-hidden /><div>Loading courses…</div></div>
            ) : err ? (
              <div className="td-notice error" role="alert">
                <div>{err}</div>
                <button className="td-btn" onClick={loadMine}><MdRefresh size={16} /><span>Retry</span></button>
              </div>
            ) : courses.length === 0 ? (
              <div className="td-notice empty">{q ? <>No matches for “{q}”.</> : <>No courses yet.</>}</div>
            ) : (
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
                    <CourseCard
                      key={c._id || c.id}
                      course={{ ...c, assignmentsCount: c.count ?? c.assignmentsCount ?? 0 }}
                    />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'catalog' && (
          <>
            {catalog.loading ? (
              <div className="td-notice"><div className="td-spinner" aria-hidden /><div>Loading catalog…</div></div>
            ) : catalog.error ? (
              <div className="td-notice error" role="alert">
                <div>{catalog.error}</div>
                <button className="td-btn" onClick={loadCatalog}><MdRefresh size={16} /><span>Retry</span></button>
              </div>
            ) : catalog.items.length === 0 ? (
              <div className="td-notice empty">No courses found.</div>
            ) : (
              <div className="td-grid">
                {catalog.items
                  .filter(c => (q ? (c.title || '').toLowerCase().includes(q.toLowerCase()) : true))
                  .slice(0, limit)
                  .map(c => {
                    const status = c.enrollmentStatus || 'none';
                    return (
                      <div key={c._id || c.id} className="td-card">
                        <div className="td-card-title">{c.title || 'Course'}</div>
                        <div className="td-card-sub">{c.ownerName ? <span>By {c.ownerName}</span> : null}</div>
                        <p className="td-card-desc">{c.description || 'No description'}</p>
                        <div className="td-card-actions">
                          {status === 'pending' ? (
                            <span className="td-chip">Pending approval</span>
                          ) : (
                            <button className="td-btn primary" onClick={() => onEnroll(c._id || c.id)}>Enroll</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, disabled, title }) {
  return (
    <button
      className={`cd-tab ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      role="tab"
      aria-selected={active}
    >
      {label}
    </button>
  );
}
