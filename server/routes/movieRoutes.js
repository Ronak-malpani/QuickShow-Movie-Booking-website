// --- In movieRoutes.js ---
import express from "express";
import { fetchNowPlaying, fetchUpcomingMovies, fetchMovieDetails } from "../controllers/movieController.js";

const router = express.Router();

// Static List Routes
router.get("/now-playing", fetchNowPlaying);
router.get("/upcoming", fetchUpcomingMovies);

router.get("/:movieId", fetchMovieDetails); 

export default router;