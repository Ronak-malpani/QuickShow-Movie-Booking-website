// File: controllers/showController.js
import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import Theater from "../models/Theater.js";
import { inngest } from "../inngest/index.js";

// =========================
//  Get Now Playing Movies (TMDB)
// =========================
export const getNowPlayingMovies = async (req, res) => {
  try {
    // Check TMDB API key existence
    if (!process.env.TMDB_API_KEY) {
      console.error("❌ TMDB_API_KEY missing in environment!");
      return res.status(500).json({
        success: false,
        message: "TMDB_API_KEY not set in environment.",
      });
    }

    console.log("✅ Fetching now-playing movies from TMDB...");

    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`;
    console.log("🌐 TMDB Request URL:", url);

    const { data } = await axios.get(url);

    if (!data || !data.results) {
      console.error("❌ Invalid TMDB API response:", data);
      return res.status(500).json({
        success: false,
        message: "Invalid response from TMDB API.",
      });
    }

    console.log(`🎬 TMDB returned ${data.results.length} movies`);

    return res.status(200).json({
      success: true,
      movies: data.results,
    });
  } catch (error) {
    console.error("TMDB API error fetching details:", error.message);
    if (error.response) {
      console.error("TMDB Response Data:", error.response.data);
      console.error("TMDB Response Status:", error.response.status);
    }
    res.status(500).json({
      success: false,
      message: `TMDB API error fetching details: ${error.message}`,
    });
  }
};

// =========================
//  Add Single Show
// =========================
export const addShow = async (req, res) => {
  try {
    const { theaterId, movieId, date, time, price } = req.body;

    if (!theaterId || !movieId || !date || !time || !price) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const show = new Show({
      theater: theaterId,
      movie: movieId,
      date,
      time,
      price,
    });

    await show.save();
    res.status(201).json({ success: true, show });
  } catch (error) {
    console.error("Error adding show:", error.message);
    res.status(500).json({ success: false, message: "Error adding show" });
  }
};

// =========================
//  Add Shows in Bulk for One Theater
// =========================
export const addShowsBulk = async (req, res) => {
  try {
    const { theaterId, shows } = req.body;

    if (!Array.isArray(shows) || !theaterId) {
      return res.status(400).json({ success: false, message: "Invalid data format" });
    }

    const bulkShows = shows.map((s) => ({
      theater: theaterId,
      movie: s.movieId,
      date: s.date,
      time: s.time,
      price: s.price,
    }));

    await Show.insertMany(bulkShows);
    res.status(201).json({ success: true, message: "Shows added successfully" });
  } catch (error) {
    console.error("Error adding shows in bulk:", error.message);
    res.status(500).json({ success: false, message: "Error adding shows in bulk" });
  }
};

// =========================
//  Add Shows Across All Theaters
// =========================
export const addShowsCrossTheaters = async (req, res) => {
  try {
    const { movieId, date, time, price } = req.body;

    if (!movieId || !date || !time || !price) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const theaters = await Theater.find();
    if (!theaters.length) {
      return res.status(404).json({ success: false, message: "No theaters found" });
    }

    const allShows = theaters.map((theater) => ({
      theater: theater._id,
      movie: movieId,
      date,
      time,
      price,
    }));

    await Show.insertMany(allShows);
    res.status(201).json({ success: true, message: "Shows added to all theaters" });
  } catch (error) {
    console.error("Error adding shows across theaters:", error.message);
    res.status(500).json({ success: false, message: "Error adding shows across theaters" });
  }
};

// =========================
//  Get All Shows
// =========================
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate("movie")
      .populate("theater");
    res.status(200).json({ success: true, shows });
  } catch (error) {
    console.error("Error fetching shows:", error.message);
    res.status(500).json({ success: false, message: "Error fetching shows" });
  }
};

// =========================
//  Get Show by Movie ID
// =========================
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movie: movieId })
      .populate("movie")
      .populate("theater");

    if (!shows.length) {
      return res.status(404).json({ success: false, message: "No shows found for this movie" });
    }

    res.status(200).json({ success: true, shows });
  } catch (error) {
    console.error("Error fetching show:", error.message);
    res.status(500).json({ success: false, message: "Error fetching show" });
  }
};
