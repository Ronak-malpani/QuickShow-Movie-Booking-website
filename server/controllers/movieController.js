import axios from "axios";
import Movie from "../models/Movie.js";

// Fetch Now Playing from TMDB
export const fetchNowPlaying = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        params: { api_key: process.env.TMDB_API_KEY, language: "en-US", page: 1 },
      }
    );

    // Normalize movies
    const movies = data.results.map((m) => ({
      _id: m.id.toString(),
      title: m.title,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_date: m.release_date,
      vote_average: m.vote_average,
      vote_count: m.vote_count,
    }));

    res.json({ success: true, movies });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Failed to fetch movies" });
  }
};
