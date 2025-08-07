const courseService = require('../services/courseService');

const getCoursesByTeacher = async (req, res, next) => {
  try {
    const teacherId = req.user.id;
    const courses = await courseService.getCoursesByTeacher(teacherId);
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCoursesByTeacher,
};
 
