const corsOptions = {
  origin: (origin, cb) => {
    if (allowedOrigins.includes(origin) || !origin) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
};
