import React, { useEffect, useState, useContext } from 'react';
import { getEnrolledCourses, getStudentAssignments } from '../services/StudentApi';
import { AuthContext } from '../context/AuthContext';
import { MdLogout } from 'react-icons/md';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);

  const { logout } = useContext(AuthContext);

  useEffect(() => {
    getEnrolledCourses()
      .then(data => {
        const mappedCourses = data.map(c => ({
          id: c._id || c.id,
          name: c.title || c.name,
          description: c.description || '',
        }));
        setCourses(mappedCourses);
        return Promise.all(
          mappedCourses.map(course =>
            getStudentAssignments(course.id).then(a => ({ courseId: course.id, assignments: a }))
          )
        );
      })
      .then(allAssignments => {
        const map = {};
        allAssignments.forEach(({ courseId, assignments }) => {
          map[courseId] = assignments;
        });
        setAssignments(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout(); // כבר עושה ניקוי localStorage ו־redirect ל־/login
  };

  if (loading) {
    return (
      <div
        className="sd-container sd-notice"
        style={{
          justifyContent: 'center',
          minHeight: '100vh',
          alignItems: 'center',
          display: 'flex'
        }}
      >
        <div className="sd-spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="sd-container">
      <header className="sd-header">
        <h1 className="sd-title">הדשבורד שלי</h1>
        <button className="td-btn" onClick={handleLogout}>
          <MdLogout size={18} />
          <span>Log out</span>
        </button>
      </header>

      {courses.length === 0 ? (
        <div className="sd-panel sd-notice empty">אין לך קורסים פעילים כרגע.</div>
      ) : (
        courses.map(course => (
          <section key={course.id} className="sd-panel">
            <h2 className="sd-section-title">{course.name}</h2>
            <p>{course.description}</p>

            <div style={{ marginTop: 16 }}>
              <h3>מטלות:</h3>
              {assignments[course.id]?.length > 0 ? (
                <ul>
                  {assignments[course.id].map(a => (
                    <li key={a._id || a.id}>
                      {a.title} — {new Date(a.dueDate).toLocaleDateString('he-IL')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>אין מטלות זמינות כרגע.</p>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
