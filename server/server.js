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
import movieRoutes from './routes/movieRoutes.js';

import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();
const port = 3000;

// DB
await connectDB();

/*  
   IMPORTANT 
  Stripe webhook MUST be BEFORE express.json(),
  and must use EXACT RAW BODY
*/
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// Normal middleware
app.use(express.json());
app.use(cors({
  origin: 'https://quick-show-movie-booking-website.vercel.app',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'clerk-db-auth-token']
}));

app.use(clerkMiddleware());

// API Routes
app.get('/', (req, res) => res.send('Server is Live!'));

app.use('/api/inngest', serve({ client: inngest, functions }));

app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/movies', movieRoutes);

app.listen(port, () =>
  console.log(`Server running at http://localhost:${port}`)
);
