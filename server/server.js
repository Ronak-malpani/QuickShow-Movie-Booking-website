import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
//import { requireAuth } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
import theaterRouter from "./routes/theaterRoutes.js";
import movieRouter from "./routes/movieRoutes.js";
import releaseRoutes from "./routes/releaseRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import emailRouter from "./routes/emailRoutes.js";
import debugRoute from "./routes/debugRoute.js";

const app = express();
const port = 3001;

// --- PATH SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticPath = path.join(__dirname, "..", "Client", "public", "Theater_Img");
console.log("Attempting to serve static files from:", staticPath);

await connectDB();

// Serve static files FIRST
app.use("/Theater_Img", express.static(staticPath));

// STRIPE WEBHOOK
app.post("/api/webhook", bodyParser.raw({ type: "application/json" }), stripeWebhooks);

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://quick-show-movie-booking-website.vercel.app",
  "https://quick-show-movie-booking-website-6qo2zih76.vercel.app",
  "https://quick-show-movie-booking-we-git-7c6c86-ronaks-projects-305c69af.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Public routes — no authentication
app.get("/", (req, res) => res.send("Server is Live!"));
app.use("/api", debugRoute);
app.use("/api/show", showRouter);
app.use("/api/movies", movieRouter);
app.use("/api/theaters", theaterRouter);
app.use("/api/releases", releaseRoutes);
app.use("/api/email", emailRouter);
app.use("/api/inngest", serve({ client: inngest, functions }));

// ✅ Protected routes — require login
app.use("/api/booking", requireAuth(), bookingRouter);
app.use("/api/admin", requireAuth(), adminRouter);
app.use("/api/user", requireAuth(), userRouter);

// ✅ For local testing
app.get("/api/test-env", (req, res) => {
  res.json({
    TMDB_API_KEY: process.env.TMDB_API_KEY ? "✅ Loaded" : "❌ Missing",
    TMDB_READ_ACCESS_TOKEN: process.env.TMDB_READ_ACCESS_TOKEN ? "✅ Loaded" : "❌ Missing",
  });
});

// ✅ Debug route (added for testing)
app.get("/api/debug", (req, res) => {
  res.json({ message: "Debug route active", protectAdminBypassed: true });
});

// ✅ Only run server locally
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () =>
    console.log(`Server Listening at http://localhost:${port}`)
  );
}

// 404 fallback (keep last)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

export default app; // ✅ Vercel will use this
