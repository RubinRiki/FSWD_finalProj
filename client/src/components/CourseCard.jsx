import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdFolderOpen } from 'react-icons/md';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const coverUrl =  course?.coverUrl || course?.imageUrl || '';
  const handleEnterCourse = () => {
    if (course?._id) navigate(`/courses/${course._id}`);
  };

  return (
    <div className="course-card">
      {/* cover */}
      <div
        className={`course-cover${coverUrl ? ' has-image' : ''}`}
        role="img"
        aria-label={course?.title || 'Course cover'}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
      />

      {/* body */}
      <h2>{course?.title ?? 'Untitled course'}</h2>
      <p>Assignments: {course?.assignmentsCount ?? 0}</p>

      <div className="card-actions">
        <button className="td-btn primary" onClick={handleEnterCourse}>
          <MdFolderOpen style={{ marginRight: 6 }} />
          Manage Course
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
