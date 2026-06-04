import express from 'express';

const app = express();
const PORT = 8000;

// Middleware to parse JSON payloads
app.use(express.json());

// Root GET route returning a short message
app.get('/', (req, res) => {
    res.send('Welcome to the Classroom API');
});

// Start the server and log the URL
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
