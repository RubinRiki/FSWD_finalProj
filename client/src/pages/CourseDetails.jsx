import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAssignment, MdPeople, MdCalendarToday } from 'react-icons/md';
import { AuthContext } from '../context/AuthContext';
import { getCourse, getAssignments, getStudents } from '../services/courseApi';
import './CourseDetails.css';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'teacher';

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [courseErr, setCourseErr] = useState('');

  const [tab, setTab] = useState('assignments');

  const [assignments, setAssignments] = useState([]);
  const [aLoaded, setALoaded] = useState(false);
  const [aLoading, setALoading] = useState(false);
  const [aErr, setAErr] = useState('');

  const [students, setStudents] = useState([]);
  const [sLoaded, setSLoaded] = useState(false);
  const [sLoading, setSLoading] = useState(false);
  const [sErr, setSErr] = useState('');

  useEffect(() => {
    loadCourse();
    setTab('assignments');
    setAssignments([]); setALoaded(false); setAErr(''); setALoading(false);
    setStudents([]);    setSLoaded(false); setSErr(''); setSLoading(false);
  }, [courseId]);

  async function loadCourse() {
    setLoadingCourse(true);
    setCourseErr('');
    try {
      const res = await getCourse(courseId);
      setCourse(res?.data || null);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load course';
      setCourseErr(msg);
    } finally {
      setLoadingCourse(false);
    }
  }

  useEffect(() => {
    if (tab === 'assignments' && !aLoaded) loadAssignments();
    if (tab === 'students'    && !sLoaded) loadStudents();
  }, [tab]);

  async function loadAssignments() {
    setALoading(true); setAErr('');
    try {
      const res = await getAssignments(courseId);
      setAssignments(Array.isArray(res?.data) ? res.data : []);
      setALoaded(true);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load assignments';
      setAErr(msg); setALoaded(true);
    } finally {
      setALoading(false);
    }
  }

  async function loadStudents() {
    setSLoading(true); setSErr('');
    try {
      const res = await getStudents(courseId);
      setStudents(Array.isArray(res?.data) ? res.data : []);
      setSLoaded(true);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to load students';
      setSErr(msg); setSLoaded(true);
    } finally {
      setSLoading(false);
    }
  }

  const canViewStudents = !!course?.permissions?.canViewStudents;

  return (
    <div className="cd">
      <div className="cd-topbar">
        <button className="cd-back" onClick={() => navigate(-1)}>
          <MdArrowBack size={18} /> Back
        </button>
        <div className="cd-title cd-title-xl">{course?.title || 'Course'}</div>
      </div>

      <section className="cd-about">
        {loadingCourse ? (
          <div className="cd-skel skel-title" />
        ) : (
          <>
            <h3>Description</h3>
            <p className="cd-desc">{course?.description || 'No description yet.'}</p>
            <div className="cd-meta">
              <div><strong>Created by:</strong> {course?.createdBy?.name || '-'}</div>
              <div><strong>Created at:</strong> {course?.createdAt ? new Date(course.createdAt).toLocaleString() : '-'}</div>
            </div>
          </>
        )}
      </section>

      <section className="cd-stats">
        <Stat
          tone="purple"
          label="Assignments"
          value={loadingCourse ? null : course?.stats?.assignments ?? '-'}
          icon={<MdAssignment size={18} />}
        />
        <Stat
          tone="teal"
          label="Students"
          value={loadingCourse ? null : course?.stats?.students ?? '-'}
          icon={<MdPeople size={18} />}
        />
        <Stat
          tone="amber"
          label="Upcoming due"
          value={loadingCourse ? null : course?.stats?.upcoming ?? '-'}
          icon={<MdCalendarToday size={18} />}
        />
      </section>

      <nav className="cd-tabs" role="tablist" aria-label="Course tabs">
        <TabButton active={tab === 'assignments'} onClick={() => setTab('assignments')} label="Assignments" />
        <TabButton
          active={tab === 'students'}
          onClick={() => setTab('students')}
          label="Students"
          disabled={!isTeacher || !canViewStudents}
          title={!isTeacher ? 'Teacher only' : undefined}
        />
      </nav>

      <div className="cd-panel">
        {courseErr && !loadingCourse && <PanelError text={courseErr} onRetry={loadCourse} />}

        {tab === 'assignments' && (
          <>
            {aLoading && <PanelLoading text="Loading assignments…" compact />}
            {!aLoading && aErr && <PanelError text={aErr} onRetry={loadAssignments} />}
            {!aLoading && !aErr && (
              assignments.length === 0
                ? <EmptyState text="No assignments yet." />
                : (
                  <ul className="cd-list">
                    {assignments.map(a => (
                      <li key={a._id} className="cd-row">
                        <div className="cd-row-main">
                          <div className="cd-row-title">{a.title}</div>
                          <div className="cd-row-sub">
                            Due: {a.dueDate ? new Date(a.dueDate).toLocaleString() : 'No due date'}
                          </div>
                        </div>
                        <div className="cd-row-meta">
                          <span className="cd-chip">{a.submitted ?? 0} submissions</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
            )}
          </>
        )}

        {tab === 'students' && (
          <>
            {sLoading && <PanelLoading text="Loading students…" compact />}
            {!sLoading && sErr && <PanelError text={sErr} onRetry={loadStudents} />}
            {!sLoading && !sErr && (
              students.length === 0
                ? <EmptyState text="No students yet." />
                : (
                  <ul className="cd-list">
                    {students.map(e => (
                      <li key={e._id} className="cd-row">
                        <div className="cd-row-main">
                          <div className="cd-row-title">{e.student?.name || 'Student'}</div>
                          <div className="cd-row-sub">{e.student?.email || ''}</div>
                        </div>
                        <div className="cd-row-meta">
                          <span className="cd-chip">Enrolled</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, tone = 'purple' }) {
  return (
    <div className={`cd-card ${tone}`}>
      <div className="cd-card-icon">{icon}</div>
      <div className="cd-card-body">
        <div className="cd-card-label">{label}</div>
        {value === null ? <div className="cd-skel skel-lg" /> : <div className="cd-card-value">{value}</div>}
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

function PanelLoading({ text, compact }) {
  return (
    <div className={`cd-notice ${compact ? 'compact' : ''}`}>
      <div className="cd-spinner" aria-hidden />
      <span>{text}</span>
    </div>
  );
}

function PanelError({ text, onRetry }) {
  return (
    <div className="cd-notice error" role="alert">
      <span>{text}</span>
      {onRetry && <button className="cd-btn" onClick={onRetry}>Retry</button>}
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="cd-notice empty">{text}</div>;
}
