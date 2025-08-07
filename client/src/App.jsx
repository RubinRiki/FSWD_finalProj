import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';


const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

      </Routes>
    </AuthProvider>
  );
};

export default App;
