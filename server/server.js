import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
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
import  { sendEmail } from "./configs/nodemailer.js";


import debugRoute from "./routes/debugRoute.js";
app.use("/api", debugRoute);

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

//  STRIPE WEBHOOK (must come before express.json)
app.post(
  "/api/webhook",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhooks
);


//  Apply other middleware AFTER webhook route
app.use(cors());
app.use(clerkMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//  Register other routes
app.get("/", (req, res) => res.send("Server is Live!"));
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/theaters", theaterRouter);
app.use("/api/movies", movieRouter);
app.use("/api/releases", releaseRoutes);
app.use("/api/email", emailRouter);


//  Start server
app.listen(port, () =>
  console.log(` Server Listening at http://localhost:${port}`)
);
