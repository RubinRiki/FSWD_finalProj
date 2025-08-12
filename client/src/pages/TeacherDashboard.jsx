// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import { MdAddCircle, MdRefresh, MdLogout } from 'react-icons/md';
import CourseCard from '../components/CourseCard';
import { getCoursesList, createCourse } from '../services/teacherApi';
import { AuthContext } from '../context/AuthContext';
import { confirm, toast, error, promptCourse } from '../utils/alerts';
import './TeacherDashboard.css';

export default function TeacherDashboard() {
  const { user, logout } = useContext(AuthContext);
  const teacherName = user?.name || 'Teacher';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(12);
  const [sort, setSort] = useState('-createdAt');

  const fetchCourses = ({ limit, q, sort }) => getCoursesList({ limit, q, sort });

  const loadCourses = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await fetchCourses({ limit, q, sort });
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load courses';
      setErr(msg);
      error('Load error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, [limit, q, sort]);

  const setSortSafe = (v) => setSort(v);

  const handleLogout = async () => {
    const res = await confirm({
      title: 'Log out?',
      text: 'You will be returned to the login screen.',
      confirmButtonText: 'Log out',
    });
    if (res.isConfirmed) logout();
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

  return (
    <div className="td-container">
      <header className="td-header">
        <h1 className="td-title">Hello, {teacherName}</h1>
        <div className="td-header-actions">
          <button className="td-btn primary" disabled={loading} onClick={handleCreateClick}>
            <MdAddCircle size={18} />
            <span>Create Course</span>
          </button>
          <button className="td-btn" onClick={handleLogout}>
            <MdLogout size={18} />
            <span>Log out</span>
          </button>
        </div>
      </header>

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
          <button className="td-btn" onClick={loadCourses}>
            <MdRefresh size={16} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {!loading && !err && (
        courses.length === 0 ? (
        <div className="td-panel td-notice empty">
            {q ? <>No matches for “{q}”.</> : <>No courses yet. Click <strong>Create Course</strong>.</>}
        </div>
        ) : (
          <section className="td-panel">
            <h2 className="td-section-title">My Courses</h2>
            <div className="td-grid">
              {courses.map((c) => (
                <CourseCard key={c._id} course={{ ...c, assignmentsCount: c.count ?? c.assignmentsCount ?? 0 }} />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
