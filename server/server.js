// File: server.js

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import theaterRouter from './routes/theaterRoutes.js'; 
import helmet from 'helmet';
import movieRouter from './routes/movieRoutes.js';
import releaseRoutes from './routes/releaseRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3001;

// --- ABSOLUTE PATH FOR STATIC FILES ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname, '..', 'Client', 'public', 'Theater_Img');
console.log('Attempting to serve static files from:', staticPath);

await connectDB();

// Serve static images
app.use('/Theater_Img', express.static(staticPath));

// Security & Middleware
/* app.use(helmet({ ... })); */ // Keep helmet commented out for now
app.use(cors());
app.use(clerkMiddleware());


// --- CRITICAL FIX: BODY PARSERS ORDER ---

// 1. RAW Body Parser for Stripe ONLY: This must come FIRST and be applied *only* to the webhook route.
// We use type: '*/*' and express.raw to get the unparsed body.
app.use('/api/stripe', express.raw({ type: '*/*' }), stripeWebhooks);

// 2. Regular JSON Parser for ALL OTHER Routes: This must come AFTER the raw parser.
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// --- END CRITICAL FIX ---


// API Routes
app.get('/', (req, res) => res.send('Server is Live!'));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/theaters', theaterRouter); 
app.use('/api/movies', movieRouter);
app.use('/api/releases', releaseRoutes);

app.listen(port, () => console.log(`Server Listening at http://localhost:${port}`));