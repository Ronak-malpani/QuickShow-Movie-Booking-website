import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load .env from server folder
dotenv.config({ path: path.resolve("./server/.env") });

console.log("Mongo URI:", process.env.MONGODB_URI);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Mongo URI not found. Check your .env file!");
  process.exit(1);
}

// Connect to MongoDB
await mongoose.connect(uri, { dbName: "quickshow" });
console.log("Connected to MongoDB");

// Flexible schemas
const Show = mongoose.model(
  "Show",
  new mongoose.Schema({}, { strict: false, collection: "shows" })
);
const Movie = mongoose.model(
  "Movie",
  new mongoose.Schema({}, { strict: false, collection: "movies" })
);

// Fetch data
const movies = await Movie.find({});
console.log(`Found ${movies.length} movies`);

const shows = await Show.find({});
console.log(`Found ${shows.length} shows`);

let updatedCount = 0;

for (const show of shows) {
  if (!show.movie) {
    console.log(`Show _id: ${show._id} has no movie field, skipping`);
    continue;
  }

  const showMovieId = show.movie.toString();

  // Find movie safely
  const movie = movies.find(
    m => m._id && m._id.toString() === showMovieId
  );

  if (movie) {
    await Show.updateOne(
      { _id: show._id },
      { $set: { movie: movie._id.toString() } }
    );
    updatedCount++;
  } else {
    console.log(
      `No matching movie found for show _id: ${show._id}, movie field: ${show.movie}`
    );
  }
}

console.log(`Updated ${updatedCount} shows successfully`);

await mongoose.disconnect();
console.log("Disconnected from MongoDB");
