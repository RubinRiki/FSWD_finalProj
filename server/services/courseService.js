const Course = require('../models/Course');

const getCoursesByTeacher = async (teacherId) => {
  return Course.find({ createdBy: teacherId }).sort({ createdAt: -1 });
};

module.exports = {
  getCoursesByTeacher,
};
