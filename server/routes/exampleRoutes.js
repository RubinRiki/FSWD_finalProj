const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/exampleController');

router.get('/', exampleController.getAllExamplesController);
router.get('/:id', exampleController.getExampleByIdController);
router.post('/add', exampleController.createExampleController);
router.put('/:id', exampleController.updateExampleController);
router.delete('/:id', exampleController.deleteExampleController);

module.exports = router;