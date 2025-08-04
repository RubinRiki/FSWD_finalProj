const express = require('express');
const router = express.Router();
const Example = require('../models/exampleModel');

// שליפת כל הדאטה
router.get('/', async (req, res) => {
  try {
    const data = await Example.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
