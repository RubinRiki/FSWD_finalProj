require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');
const corsOptions = require('./config/corsOptions');


// Import your middleware modules
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes'); 
const coursesRoutes = require('./routes/courses');
const assignmentsRoutes = require('./routes/assignments');
const enrollmentsRoutes = require('./routes/enrollments');


connectDB();

app.use(cors(corsOptions)); 
app.use(express.json());
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);


// TODO: Use auth middleware on protected routes, e.g.:
// app.use('/api/private', authMiddleware, privateRoutes);

// TODO: Add other routes here

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));