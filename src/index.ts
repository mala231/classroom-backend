import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import subjectsRouter from "./routes/subjects.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

if (!process.env.FRONTEND_URL) {
  throw new Error('Frontend URL is not set in the env file.');
}

// Middleware to parse incoming JSON requests
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true

}))

// API Routes
app.use('/api/subjects', subjectsRouter);

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('Hello, welcome to the Classroom API!');
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});