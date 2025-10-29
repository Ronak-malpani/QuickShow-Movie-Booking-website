// server/routes/movieRoutes.js
import express from 'express';
import { getUpcomingMovies, getMovieDetails } from '../controllers/movieController.js';
import Movie from '../models/Movie.js'; // Make sure this path is correct

const movieRouter = express.Router();

// Fetch upcoming movies from TMDB
movieRouter.get('/upcoming', getUpcomingMovies);

// Fetch single movie details
movieRouter.get('/:id', getMovieDetails);

// Fetch all movies from your database
movieRouter.get('/', async (req, res) => {
  try {
    const movies = await Movie.find(); // fetch all movies
    res.json({ success: true, data: movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error fetching movies" });
  }
});

export default movieRouter;
