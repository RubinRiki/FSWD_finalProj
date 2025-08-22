import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Auth from './pages/Auth';
import TeacherDashboard from './pages/TeacherDashboard';
import CourseDetails from './pages/CourseDetails';
import StudentDashboard from './pages/StudentDashboard';
import Assignment from './pages/Assignment';
import AssignmentStudent from './pages/AssignmentStudent'; // ⬅️ NEW

function HomeRedirect() {
  const { isAuthenticated, user } = useContext(AuthContext);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const to = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
  return <Navigate to={to} replace />;
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function RequireRole({ role, children }) {
  const { user } = useContext(AuthContext);
  return user?.role === role ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        <Route
          path="/teacher/dashboard"
          element={
            <RequireAuth>
              <RequireRole role="teacher">
                <TeacherDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <RequireAuth>
              <RequireRole role="student">
                <StudentDashboard />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/courses/:courseId"
          element={
            <RequireAuth>
              <CourseDetails />
            </RequireAuth>
          }
        />

        {/* Teacher assignment details */}
        <Route
          path="/assignments/:assignmentId"
          element={
            <RequireAuth>
              <RequireRole role="teacher">
                <Assignment />
              </RequireRole>
            </RequireAuth>
          }
        />

        {/* Student assignment details */}
        <Route
          path="/assignments/:assignmentId/me"
          element={
            <RequireAuth>
              <RequireRole role="student">
                <AssignmentStudent />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
