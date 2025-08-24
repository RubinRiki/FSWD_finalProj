
  const allowedOrigins = new Set(
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.WEB_ORIGIN,
      ...extra,
    ].filter(Boolean)
  );
  
const corsOptions = {
  origin: (origin, cb) => {
    if (allowedOrigins.has(origin) || !origin) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
};
