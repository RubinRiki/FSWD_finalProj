// services/exampleService.js

const Example = require('../models/exampleModel');

/**
 * Retrieve all examples from the database.
 */
const getAllExamples = async () => {
  return await Example.find();
};

/**
 * Retrieve example by ID.
 */
const getExampleById = async (id) => {
  return await Example.findById(id);
};

/**
 * Create a new example.
 */
const createExample = async (data) => {
  const example = new Example(data);
  return await example.save();
};

/**
 * Update example by ID.
 */
const updateExample = async (id, data) => {
  return await Example.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

/**
 * Delete example by ID.
 */
const deleteExample = async (id) => {
  return await Example.findByIdAndDelete(id);
};

module.exports = {
  getAllExamples,
  getExampleById,
  createExample,
  updateExample,
  deleteExample,
};
