import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import subjectsRouter from "./routes/subjects.js";
import classesRouter from "./routes/classes.js";
import usersRouter from "./routes/users.js";
import departmentsRouter from "./routes/departments.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

if (!process.env.FRONTEND_URL) {
  throw new Error('Frontend URL is not set in the env file.');
}

// Middleware to parse incoming JSON requests
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// API Routes
app.use('/api/subjects', subjectsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/users', usersRouter);
app.use('/api/departments', departmentsRouter);

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('Hello, welcome to the Classroom API!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});