import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Load env variables from .env (local dev only — Render uses its dashboard env vars)
dotenv.config();

const app = express();

// CORS — allow both local dev and deployed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://job-portal-five-hazel.vercel.app', // Vercel deployment
  process.env.FRONTEND_URL, // Additional frontend URL from Render env vars
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle pre-flight requests
app.use(express.json());

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Root health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'MERN Job Portal API is running...' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Connect to MongoDB then start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI is not set in environment variables.');
  console.error('   → For local dev: add it to backend/.env');
  console.error('   → For Render: add it in the Render dashboard Environment tab');
  process.exit(1);
}

console.log(`🔌 Connecting to MongoDB...`);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // Fail fast after 10s if Atlas is unreachable
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`❌ Database connection failed: ${err.message}`);
    console.error('   → Check your MONGODB_URI is correct and Atlas Network Access allows 0.0.0.0/0');
    process.exit(1);
  });
