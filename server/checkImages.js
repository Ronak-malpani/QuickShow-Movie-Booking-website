// File: server/checkImages.js

import mongoose from 'mongoose';
import fs from 'fs';       // Node.js File System module
import path from 'path';     // Node.js Path module
import { fileURLToPath } from 'url';
import Theater from './models/Theater.js'; // Adjust path to your Theater model
import 'dotenv/config';                   // For your database connection string

// --- 1. DEFINE THE EXACT PATH TO YOUR IMAGE FOLDER ---
// This MUST match the path in your server.js and logs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// This path goes from /server, up one level, then into /Client/public/Theater_Img
const IMAGE_DIRECTORY = path.join(__dirname, '..', 'Client', 'public', 'Theater_Img');

// --- 2. DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    // Make sure your .env file has MONGODB_URI
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected for checking images...");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

// --- 3. THE VERIFICATION FUNCTION ---
const verifyTheaterImages = async () => {
  await connectDB();
  
  console.log(`\nVerifying images in folder: ${IMAGE_DIRECTORY}\n`);

  const theaters = await Theater.find({});
  let missingCount = 0;
  let foundCount = 0;

  if (theaters.length === 0) {
    console.log("No theaters found in the database.");
    return;
  }

  for (const theater of theaters) {
    const imageUrl = theater.imageUrl;
    const theaterId = theater.theaterId || theater._id;

    if (!imageUrl || imageUrl.trim() === "") {
      console.warn(`[SKIPPED] Theater ${theaterId}: No imageUrl field in database.`);
      continue;
    }

    // Get the base filename (e.g., "TH3.png" from "/Theater_Img/TH3.png")
    const filename = path.basename(imageUrl);
    const fullPath = path.join(IMAGE_DIRECTORY, filename);

    // 4. CHECK IF FILE EXISTS
    if (!fs.existsSync(fullPath)) {
      console.error(`[MISSING] Theater ${theaterId}: Cannot find file '${filename}'`);
      missingCount++;
    } else {
      foundCount++;
    }
  }

  console.log("\n---------------------------------");
  console.log(`Scan Complete.`);
  console.log(`  Found: ${foundCount} files`);
  console.log(`  Missing: ${missingCount} files`);
  console.log("---------------------------------");
  
  if (missingCount > 0) {
      console.log("\nTo fix, please find the correct filenames and update the 'imageUrl' field for the missing theaters in your database.");
  }

  await mongoose.disconnect();
};

// Run the script
verifyTheaterImages();