import React, { useEffect, useState } from 'react';
import { MdAddCircle } from 'react-icons/md';
import CourseCard from '../components/CourseCard';
import { getTeacherCourses } from '../services/teacherApi'; 
const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const teacherName = "Don Cohen"; // this can be dynamic later

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getTeacherCourses(); 
        setCourses(data);
      } catch (err) {
        console.error('Failed to fetch teacher courses', err);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <h1>Hello, {teacherName}</h1>
        <button className="add-course-button">
          <MdAddCircle size={20} style={{ marginLeft: '5px' }} />
          Add Course
        </button>
      </header>

      <section className="course-list">
        {courses.map(course => (
          <CourseCard key={course._id} course={course} />
        ))}
      </section>
    </div>
  );
};

export default TeacherDashboard;
