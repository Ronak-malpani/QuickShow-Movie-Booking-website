// releaseRoutes.js
import express from "express";
import fetch from "node-fetch";
import Movie from "../models/Movie.js";

const router = express.Router();

router.get("/upcoming", async (req, res) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1&region=US`
    );
    const data = await response.json();

    const filteredMovies = [];

    for (const movie of data.results) {
      const exists = await Movie.findOne({ tmdb_id: movie.id });
      if (!movie.release_date || movie.release_date > today || !exists) {
        filteredMovies.push({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          overview: movie.overview,
          release_date: movie.release_date,
        });
      }
    }

    res.json(filteredMovies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching upcoming movies" });
  }
});

export default router;
