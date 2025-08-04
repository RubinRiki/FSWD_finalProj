const express = require('express');
const app = express();
require('dotenv').config();
const connectDB = require('./config/db');

// התחברות ל-MongoDB
connectDB();

app.use(express.json());

// חיבור ה־routes
const exampleRoutes = require('./routes/exampleRoutes');
app.use('/api/example', exampleRoutes);

// הרצת השרת
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
