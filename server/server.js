require('dotenv').config();
const express = require('express');
const app = express();
app.disable('x-powered-by'); 
const cors = require('cors');
const connectDB = require('./config/db');
const corsOptions = require('./config/corsOptions');


// Import your middleware modules
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

// Routes
const authRoutes = require('./routes/authRoutes'); 
const coursesRoutes = require('./routes/courses');
const assignmentsRoutes = require('./routes/assignments');
const enrollmentsRoutes = require('./routes/enrollments');
const submissionsRoutes = require('./routes/submissions');

connectDB();

app.use(cors(corsOptions)); 
app.use(express.json());
app.use(logger);


app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/submissions', submissionsRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'production') {
  const listEndpoints = require('express-list-endpoints');

  function withPrefix(prefix, routesArr) {
    return routesArr.map(r => ({
      path: (prefix + (r.path === '/' ? '' : r.path)).replace(/\/{2,}/g, '/'),
      methods: r.methods
    }));
  }

  app.get('/__routes', (req, res) => {
    const eps = [
      ...withPrefix('/api/auth',        listEndpoints(authRoutes)),
      ...withPrefix('/api/courses',     listEndpoints(coursesRoutes)),
      ...withPrefix('/api/assignments', listEndpoints(assignmentsRoutes)),
      ...withPrefix('/api/enrollments', listEndpoints(enrollmentsRoutes)),
      ...withPrefix('/api/submissions', listEndpoints(submissionsRoutes)),
    ];

    const dedup = [];
    const seen = new Set();
    for (const r of eps) {
      const key = `${r.path} ${r.methods.slice().sort().join(',')}`;
      if (!seen.has(key)) { seen.add(key); dedup.push(r); }
    }

    dedup.sort((a, b) => a.path.localeCompare(b.path));
    res.json(dedup);
  });
}

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


