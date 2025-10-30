import express from "express";
const router = express.Router();

router.get("/debug-env", (req, res) => {
  res.json({
    MONGO_URI: !!process.env.MONGODB_URI,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SENDER_EMAIL: !!process.env.SENDER_EMAIL,
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    INNGEST_EVENT_KEY: !!process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: !!process.env.INNGEST_SIGNING_KEY,
    TMDB_API_KEY: !!process.env.TMDB_API_KEY,
  });
});

export default router;
