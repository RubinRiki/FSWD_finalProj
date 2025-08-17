import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAssignment, MdPeople, MdCalendarToday, MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { AuthContext } from '../context/AuthContext';
import { getCourse, getAssignments, getStudents, updateCourse, deleteCourse, createAssignment, updateAssignment, deleteAssignment } from '../services/courseApi';
import { confirm, success, error as alertError, toast } from '../utils/alerts';
import './CourseDetails.css';

function fmtRel(ms){
  const abs=Math.abs(ms);
  const d=Math.floor(abs/(24*60*60*1000));
  const h=Math.floor((abs%(24*60*60*1000))/(60*60*1000));
  const m=Math.floor((abs%(60*60*1000))/(60*1000));
  const parts=[];
  if(d) parts.push(d+'d');
  if(h) parts.push(h+'h');
  if(!d && !h) parts.push(m+'m');
  return ms>=0 ? 'in '+parts.join(' ') : parts.join(' ')+' ago';
}
function dueInfo(raw){
  if(!raw) return null;
  const due=new Date(raw);
  if(Number.isNaN(due.getTime())) return null;
  const now=Date.now();
  const diff=due.getTime()-now;
  const week=7*24*60*60*1000;
  const status=diff<0?'closed':diff<=week?'soon':'open';
  const label=status==='closed'?'Closed':status==='soon'?'Due soon':'Open';
  return {status,label,when:fmtRel(diff),dueText:due.toLocaleString()};
}
async function promptCourseEdit(initial){
  const title=window.prompt('Course title', initial?.title||'');
  if(title==null) return null;
  const description=window.prompt('Course description', initial?.description||'');
  if(description==null) return null;
  return { title:title.trim(), description:description.trim() };
}
async function promptAssignment(initial){
  const title=window.prompt('Assignment title', initial?.title||'');
  if(title==null) return null;
  const dueRaw=window.prompt('Due date (YYYY-MM-DDTHH:mm, optional)', initial?.dueDate?new Date(initial.dueDate).toISOString().slice(0,16):'');
  const payload={ title:title.trim() };
  if(dueRaw && dueRaw.trim()) payload.dueDate=new Date(dueRaw).toISOString();
  return payload;
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
    setStudents([]); setSLoaded(false); setSErr(''); setSLoading(false);
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
    if (tab === 'students' && !sLoaded) loadStudents();
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

  async function onEditCourse(){
    const values=await promptCourseEdit({ title:course?.title||'', description:course?.description||'' });
    if(!values) return;
    try{
      await updateCourse(courseId, values);
      await loadCourse();
      success('Course updated');
    }catch(e){
      const msg=e?.response?.data?.error||e?.message||'Update failed';
      alertError('Action failed', msg);
    }
  }
  async function onDeleteCourse(){
    const ok=await confirm({ title:'Delete course?', text:'This action may be restricted by server rules.' });
    if(!ok.isConfirmed) return;
    try{
      await deleteCourse(courseId);
      toast({ icon:'success', title:'Course deleted' });
      navigate(-1);
    }catch(e){
      const msg=e?.response?.data?.error||e?.message||'Delete failed';
      alertError('Delete failed', msg);
    }
  }
  async function onNewAssignment(){
    const payload=await promptAssignment();
    if(!payload) return;
    try{
      await createAssignment(courseId, payload);
      await loadAssignments();
      success('Assignment created');
    }catch(e){
      const msg=e?.response?.data?.error||e?.message||'Create failed';
      alertError('Action failed', msg);
    }
  }
  async function onEditAssignment(a){
    const payload=await promptAssignment(a);
    if(!payload) return;
    try{
      await updateAssignment(a._id, payload);
      await loadAssignments();
      success('Assignment updated');
    }catch(e){
      const msg=e?.response?.data?.error||e?.message||'Update failed';
      alertError('Action failed', msg);
    }
  }
  async function onDeleteAssignment(a){
    const ok=await confirm({ title:'Delete assignment?', text:'This may be blocked if submissions exist.' });
    if(!ok.isConfirmed) return;
    try{
      await deleteAssignment(a._id);
      await loadAssignments();
      toast({ icon:'success', title:'Assignment deleted' });
    }catch(e){
      const msg=e?.response?.data?.error||e?.message||'Delete failed';
      alertError('Delete failed', msg);
    }
  }

  return (
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
        <Stat tone="amber" label="Upcoming due" value={loadingCourse ? null : course?.stats?.upcoming ?? '-'} icon={<MdCalendarToday size={18} />} />
      </section>

      <nav className="cd-tabs" role="tablist" aria-label="Course tabs">
        <TabButton active={tab === 'assignments'} onClick={() => setTab('assignments')} label="ASSIGNMENTS" />
        <TabButton active={tab === 'students'} onClick={() => setTab('students')} label="STUDENTS" disabled={!isTeacher || !canViewStudents} title={!isTeacher ? 'Teacher only' : undefined} />
      </nav>

      <div className="cd-panel">
        {courseErr && !loadingCourse && <PanelError text={courseErr} onRetry={loadCourse} />}

        {tab === 'assignments' && (
          <>
            {aLoading && <PanelLoading text="Loading assignments…" compact />}
            {!aLoading && aErr && <PanelError text={aErr} onRetry={loadAssignments} />}
            {!aLoading && !aErr && (
              assignments.length === 0 ? (
                <EmptyState text="No assignments yet." />
              ) : (
                <ul className="cd-list">
                  {assignments.map(a => {
                    const due = dueInfo(a.dueDate);
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
                          <span className="cd-chip">{a.submitted ?? 0} submissions</span>
                        </div>
                        <div className="cd-row-actions">
                          {isTeacher && (
                            <>
                              <button className="cd-btn ghost slim" onClick={() => onEditAssignment(a)}><MdEdit size={14}/>Edit</button>
                              <button className="cd-btn ghost danger slim" onClick={() => onDeleteAssignment(a)}><MdDelete size={14}/>Delete</button>
                            </>
                          )}
                          <button className="cd-btn primary slim" onClick={() => navigate(`/assignments/${a._id}/submissions`)}>View submissions</button>
                        </div>
                      </li>
                    );
                  })}
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
              students.length === 0 ? (
                <EmptyState text="No students yet." />
              ) : (
                <ul className="cd-list">
                  {students.map(e => (
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
    <button className={`cd-tab ${active ? 'active' : ''}`} onClick={onClick} disabled={disabled} title={title} role="tab" aria-selected={active}>
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
