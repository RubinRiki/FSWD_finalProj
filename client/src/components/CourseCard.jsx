import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFolderOpen } from 'react-icons/md';
import Button from './Button';
import './CourseCard.css'; 

const CourseCard = ({ course }) => {
  const navigate = useNavigate();

  const handleEnterCourse = () => {
    if (course?._id) navigate(`/teacher/course/${course._id}`);
  };

  return (
    <div className="course-card">
      <h2>{course?.title ?? 'Untitled course'}</h2>
      <p>Assignments: {course?.assignmentsCount ?? 0}</p>

      <div className="card-actions">
        <Button onClick={handleEnterCourse}>
          <MdFolderOpen style={{ marginRight: 6 }} />
          Manage Course
        </Button>
      </div>
    </div>
  );
};

export default CourseCard;
