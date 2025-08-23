import React, { useEffect, useState, useContext,useMemo  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAssignment, MdPeople, MdCalendarToday, MdEdit, MdDelete, MdAdd } from 'react-icons/md';

import { AuthContext } from '../context/AuthContext';
import { getCourse, getAssignments, getStudents, updateCourse, deleteCourse } from '../services/courseApi';
import { createAssignment } from '../services/AssignmentApi';

import { confirm, success, error as alertError, toast } from '../utils/alerts';
import { dueInfo } from '../utils/helpers';
import './CourseDetails.css';


// Generic resource loader hook
function useResource(loader) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await loader();
      const next = Array.isArray(res?.data) ? res.data : (res?.data ?? []);
      setData(next);
      setLoaded(true);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load');
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]); setLoading(false); setLoaded(false); setError('');
  };

  return { data, loading, loaded, error, reload, reset, setData };
}

// Reusable data panel
function DataPanel({ state, emptyText, onRetry, children }) {
  if (state.loading) return <PanelLoading text="Loading…" compact />;
  if (state.error)   return <PanelError text={state.error} onRetry={onRetry} />;
  if (!state.data?.length) return <EmptyState text={emptyText} />;
  return children;
}

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isTeacher = user?.role === 'teacher';

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [courseErr, setCourseErr] = useState('');
  const [tab, setTab] = useState('assignments');

  const asg = useResource(() => getAssignments(courseId));
  const std = useResource(() => getStudents(courseId));

  // number of assignments due within the next 7 days (excluding past / missing dueDate)
  const upcomingCount = useMemo(() => {
    if (!Array.isArray(asg.data)) return 0;
    const now = Date.now();
    const in7Days = now + 7 * 24 * 60 * 60 * 1000;
    let count = 0;
    for (const a of asg.data) {
      if (!a?.dueDate) continue;
      const t = Date.parse(a.dueDate);
      if (Number.isNaN(t)) continue;
      if (t >= now && t <= in7Days) count++;
    }
    return count;
  }, [asg.data]);

  useEffect(() => {
    const resetPanels = () => {
      setTab('assignments');
      asg.reset();
      std.reset();
    };
    loadCourse();
    resetPanels();
  }, [courseId]);

  async function loadCourse() {
    setLoadingCourse(true); setCourseErr('');
    try {
      const res = await getCourse(courseId);
      setCourse(res?.data || null);
    } catch (e) {
      setCourseErr(e?.response?.data?.error || e?.message || 'Failed to load course');
    } finally {
      setLoadingCourse(false);
    }
  }

  const canViewStudents = !!course?.permissions?.canViewStudents;
  const canSeeStudentsTab = isTeacher && canViewStudents;

  useEffect(() => {
    if (tab === 'students' && !canSeeStudentsTab) setTab('assignments');
  }, [tab, canSeeStudentsTab]);

  useEffect(() => {
    if (tab === 'assignments' && !asg.loaded && !asg.loading) asg.reload();
    if (tab === 'students' && canSeeStudentsTab && !std.loaded && !std.loading) std.reload();
  }, [tab, canSeeStudentsTab]);

  async function onEditCourse() {
    const { promptCourseEdit } = await import('../utils/helpers');
    const values = await promptCourseEdit({ title: course?.title || '', description: course?.description || '' });
    if (!values) return;
    try {
      await updateCourse(courseId, values);
      await loadCourse();
      success('Course updated');
    } catch (e) {
      alertError('Action failed', e?.response?.data?.error || e?.message || 'Update failed');
    }
  }

  async function onDeleteCourse() {
    const ok = await confirm({ title: 'Delete course?', text: 'This action may be restricted by server rules.' });
    if (!ok.isConfirmed) return;
    try {
      await deleteCourse(courseId);
      toast({ icon: 'success', title: 'Course deleted' });
      navigate(-1);
    } catch (e) {
      alertError('Delete failed', e?.response?.data?.error || e?.message || 'Delete failed');
    }
  }

  async function onNewAssignment() {
    const { promptAssignment } = await import('../utils/helpers');
    const payload = await promptAssignment();
    if (!payload) return;
    try {
      await createAssignment(courseId, payload);
      await asg.reload();
      success('Assignment created');
    } catch (e) {
      alertError('Action failed', e?.response?.data?.error || e?.message || 'Create failed');
    }
  }

  return (
    <div className='page-container '>
    <div className="cd">
      <div className="cd-header">
        <button className="cd-back" onClick={() => navigate(-1)}>
          <MdArrowBack size={16} /> Back
        </button>
        <div className="cd-title cd-title-xl">{course?.title || 'Course'}</div>
        {isTeacher && (
          <div className="cd-actions">
            <button className="cd-btn ghost sm" onClick={onEditCourse}><MdEdit size={16}/><span>Edit</span></button>
            <button className="cd-btn ghost danger sm" onClick={onDeleteCourse}><MdDelete size={16}/><span>Delete</span></button>
            <button className="cd-btn primary sm" onClick={onNewAssignment}><MdAdd size={16}/><span>New</span></button>
          </div>
        )}
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
        <Stat tone="purple" label="Assignments" value={loadingCourse ? null : course?.stats?.assignments ?? '-'} icon={<MdAssignment size={18} />} />
        <Stat tone="teal" label="Students" value={loadingCourse ? null : course?.stats?.students ?? '-'} icon={<MdPeople size={18} />} />
        <Stat tone="amber" label="Upcoming due" value={!asg.loaded && asg.loading ? null : upcomingCount} icon={<MdCalendarToday size={18} />} />
      </section>

      <nav className="cd-tabs" role="tablist" aria-label="Course tabs">
        <TabButton active={tab === 'assignments'} onClick={() => setTab('assignments')} label="ASSIGNMENTS" />
        {canSeeStudentsTab && (
          <TabButton active={tab === 'students'} onClick={() => setTab('students')} label="STUDENTS" />
        )}
      </nav>

      <div className="cd-panel">
        {courseErr && !loadingCourse && <PanelError text={courseErr} onRetry={loadCourse} />}

        {tab === 'assignments' && (
          <DataPanel state={asg} emptyText="No assignments yet." onRetry={asg.reload}>
            <ul className="cd-list">
              {asg.data.map(a => {
                const due = dueInfo(a.dueDate);
                const to = isTeacher ? `/assignments/${a._id}` : `/assignments/${a._id}/me`;
                return (
                  <li key={a._id} className="cd-row assignment">
                    <div className="cd-row-main">
                      <div className="cd-row-title">{a.title}</div>
                      <div className="cd-row-sub">
                        {a.dueDate ? `Due: ${new Date(a.dueDate).toLocaleString()}` : 'No due date'}
                        {due && <span className={`cd-badge ${due.status}`}>{due.label}</span>}
                        {due && <span className="cd-due-when">{due.when}</span>}
                      </div>
                    </div>
                    <div className="cd-row-meta">
                      {isTeacher && typeof a.submitted === 'number' && (
                        <span className="cd-chip">{a.submitted} submissions</span>
                      )}
                    </div>
                    <div className="cd-row-actions">
                      <button
                        className="cd-btn primary slim"
                        onClick={() =>
                          navigate(to, {
                            state: { assignment: a, course: { _id: courseId, title: course?.title } }
                          })
                        }
                      >
                        View
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </DataPanel>
        )}

        {tab === 'students' && canSeeStudentsTab && (
          <DataPanel state={std} emptyText="No students yet." onRetry={std.reload}>
            <ul className="cd-list">
              {std.data.map(e => (
                <li key={e._id} className="cd-row student">
                  <div className="cd-row-main">
                    <div className="cd-row-title">{e.student?.name || 'Student'}</div>
                  </div>
                  <div className="cd-col-email">{e.student?.email || '-'}</div>
                  <div className="cd-row-meta">
                    <span className="cd-chip">Enrolled</span>
                  </div>
                </li>
              ))}
            </ul>
          </DataPanel>
        )}
      </div>
    </div>
  </div>

  );
}

// Small UI building blocks
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
