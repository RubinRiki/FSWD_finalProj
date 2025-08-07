const Course = require('../models/Course');

const getCoursesByTeacher = async (teacherId) => {
  const courses = await Course.find({ createdBy: teacherId });
  return courses;
};

module.exports = {
  getCoursesByTeacher,
};
