const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Import your middleware modules
const logger = require('./middleware/logger');
const authMiddleware = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const uploadMiddleware = require('./middleware/uploadMiddleware');

// Routes
const exampleRoutes = require('./routes/exampleRoutes');
const authRoutes = require('./routes/authRoutes'); 

connectDB();

app.use(cors());  //TODO: Configure CORS as needed
app.use(express.json());
app.use(logger);



app.use('/api/auth', authRoutes); 
app.use('/api/example', exampleRoutes);

// TODO: Use auth middleware on protected routes, e.g.:
// app.use('/api/private', authMiddleware, privateRoutes);

// TODO: Add other routes here

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));