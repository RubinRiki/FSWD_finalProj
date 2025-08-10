import React, { useEffect, useMemo, useState, useContext } from 'react';
import { MdAddCircle, MdRefresh } from 'react-icons/md';
import CourseCard from '../components/CourseCard';
import { getTeachingCourses } from '../services/teacherApi';
import { AuthContext } from '../context/AuthContext';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useContext(AuthContext);
  const teacherName = user?.name || 'Teacher';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState(''); // search query

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await getTeachingCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load courses';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getTeachingCourses();
        if (!mounted) return;
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!mounted) return;
        const msg = e?.response?.data?.error || e?.message || 'Failed to load courses';
        setErr(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // basic client-side filtering by course title
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter(c => (c?.title || '').toLowerCase().includes(term));
  }, [courses, q]);

  // lightweight stats :
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, c) => acc + (c?.studentsCount ?? 0), 0);
    const pendingSubs  = courses.reduce((acc, c) => acc + (c?.pendingSubmissionsCount ?? 0), 0);
    return { totalCourses, totalStudents, pendingSubs };
  }, [courses]);

  return (
    <div className="td-container">
      {/* HEADER */}
      <header className="td-header">
        <h1 className="td-title">שלום, {teacherName}</h1>
        <div className="td-actions">
          <div className="td-search">
            <input
              type="search"
              placeholder="Search courses…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search courses"
            />
          </div>
          <button className="td-btn primary" disabled={loading}>
            <MdAddCircle size={18} />
            <span>Create Course</span>
          </button>
        </div>
      </header>

      {/* STATES */}
      {loading && (
        <div className="td-panel td-state">Loading courses…</div>
      )}

      {!loading && err && (
        <div className="td-panel td-state error">
          <div>{err}</div>
          <button className="td-btn" onClick={load}>
            <MdRefresh size={16} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* CONTENT */}
      {!loading && !err && (
        <>
          {/* STATS BAR */}
          <section className="td-panel td-stats">
            <div className="td-stat">
              <div className="td-stat-label">Courses</div>
              <div className="td-stat-value">{stats.totalCourses}</div>
            </div>
            <div className="td-stat">
              <div className="td-stat-label">Students</div>
              <div className="td-stat-value">{stats.totalStudents}</div>
            </div>
            <div className="td-stat">
              <div className="td-stat-label">Pending submissions</div>
              <div className="td-stat-value">{stats.pendingSubs}</div>
            </div>
          </section>

          {/* COURSES GRID / EMPTY */}
          {filtered.length === 0 ? (
            <div className="td-panel td-state">
              {q ? (
                <div>couldnt find matching courses“{q}”.</div>
              ) : (
                <div>
                    No courses yet. Click "Create Course" above to add your first course.
                </div>
              )}
            </div>
          ) : (
            <section className="td-panel">
              <h2 className="td-section-title">My Courses</h2>
              <div className="td-grid">
                {filtered.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* RECENT ACTIVITY (placeholder – לחיבור ל‑API בהמשך) */}
          <section className="td-panel">
            <h2 className="td-section-title">Recent Activity</h2>
            <ul className="td-activity">
              <li className="td-activity-item">— (hook to API: recent submissions & upcoming deadlines)</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
