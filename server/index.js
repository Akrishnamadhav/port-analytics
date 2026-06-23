require('dotenv').config();

// Fallback values for DB credentials and secrets in case local .env is overwritten
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_NAME = process.env.DB_NAME || 'portauthority';
process.env.DB_USER = process.env.DB_USER || 'admin';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'admin123';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'port-authority-jwt-secret-change-in-production';
process.env.PORT = process.env.PORT || '5000';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');
const expenseRoutes = require('./routes/expenses');
const chatRoutes = require('./routes/chat');

const app = express();

// CORS middleware configuration
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Route mounts
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/chat', chatRoutes);

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Port Authority server running on port ${PORT}`);
});
