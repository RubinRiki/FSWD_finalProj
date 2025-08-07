import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFolderOpen } from 'react-icons/md';
import Button from './Button'; // custom reusable button component

const CourseCard = ({ course }) => {
  const navigate = useNavigate();

  const handleEnterCourse = () => {
    navigate(`/teacher/course/${course._id}`);
  };

  return (
    <div className="course-card">
      <h2>{course.name}</h2>
      <p>Assignments: {course.assignmentsCount}</p>

      <div className="card-actions">
        <Button onClick={handleEnterCourse} icon={<MdFolderOpen />}>
          Manage Course
        </Button>
      </div>
    </div>
  );
};

export default CourseCard;
