// controllers/exampleController.js

const exampleService = require('../services/exampleService');

/**
 * Controller functions for handling HTTP requests related to the Example model.
 * 
 * Common CRUD operations included:
 * - getAllExamplesController: Retrieve all examples.
 * - getExampleByIdController: Retrieve example by ID.
 * - createExampleController: Create a new example.
 * - updateExampleController: Update example by ID.
 * - deleteExampleController: Delete example by ID.
 * 
 * Additional possible functions to add as needed:
 * - Advanced search with filters, sorting, and pagination.
 * - Statistics and reporting functions.
 * - Permission and user role management.
 * - Business-specific actions (e.g., activating promotions, sending emails).
 * - Authentication and authorization logic (e.g., login, token refresh).
 * 
 * This file should contain all logic for handling requests and preparing responses,
 * coordinating with models and services as appropriate.
 */

/**
 * Get all examples
 */
exports.getAllExamplesController = async (req, res) => {
  try {
    const examples = await exampleService.getAllExamples();
    res.json(examples);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get example by ID
 */
exports.getExampleByIdController = async (req, res) => {
  try {
    const example = await exampleService.getExampleById(req.params.id);
    if (!example) {
      return res.status(404).json({ message: 'Example not found' });
    }
    res.json(example);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new example
 */
exports.createExampleController = async (req, res) => {
  try {
    const newExample = await exampleService.createExample(req.body);
    res.status(201).json(newExample);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Update an example by ID
 */
exports.updateExampleController = async (req, res) => {
  try {
    const updatedExample = await exampleService.updateExample(req.params.id, req.body);
    if (!updatedExample) {
      return res.status(404).json({ message: 'Example not found' });
    }
    res.json(updatedExample);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete an example by ID
 */
exports.deleteExampleController = async (req, res) => {
  try {
    const deletedExample = await exampleService.deleteExample(req.params.id);
    if (!deletedExample) {
      return res.status(404).json({ message: 'Example not found' });
    }
    res.json({ message: 'Example deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
