// File: controllers/movieController.js

import Movie from '../models/Movie.js';
import axios from 'axios';

// Helper function using UTC dates
const getISODateString = (date) => {
    try {
        if (!(date instanceof Date) || isNaN(date.getTime())) { date = new Date(); }
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        const today = new Date();
        const year = today.getUTCFullYear();
        const month = String(today.getUTCMonth() + 1).padStart(2, '0');
        const day = String(today.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

export const getUpcomingMovies = async (req, res) => {
    console.log("--- getUpcomingMovies function started (Final Filter Check) ---");
    try {
        const apiKey = process.env.TMDB_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: "TMDB API Key not found." });
        }

        // --- DATE CALCULATION (Strictly UTC Based) ---
        const now = new Date();
        const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
        const startDate = getISODateString(tomorrowUTC);

        const futureDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 14));
        const endDate = getISODateString(futureDateUTC);
        // --- END DATE CALCULATION ---

        console.log(`Fetching upcoming movies UTC Range: ${startDate} to ${endDate}`);

        const discoverUrl = `https://api.themoviedb.org/3/discover/movie`;
        const params = {
            api_key: apiKey,
            language: 'en-US',
            sort_by: 'primary_release_date.asc',
            include_adult: false,
            include_video: false,
            page: req.query.page || 1,
            'primary_release_date.gte': startDate,
            'primary_release_date.lte': endDate,
            'with_release_type': '2|3',
        };

        console.log("TMDB API Params:", params);

        const response = await axios.get(discoverUrl, { params });
        const data = response.data;
        const results = data.results || [];
        const totalPages = data.total_pages || 1;

        console.log(`Received ${results.length} movies from TMDB page ${params.page}.`);

        // --- EXPLICIT FILTERING STEP with LOGGING ---
        const strictlyUpcoming = results.filter(movie => {
            const isUpcoming = movie.release_date && movie.release_date >= startDate;
            if (!isUpcoming && movie.release_date) { // Log only if release_date exists but is too early
                console.log(`Filtering OUT: ${movie.title} (Release: ${movie.release_date}) because it's before ${startDate}`);
            }
            return isUpcoming;
        });
        console.log(`Filtered down to ${strictlyUpcoming.length} strictly upcoming movies.`);
        // --- END FILTERING STEP ---

        res.json({
            success: true,
            data: strictlyUpcoming,
            page: params.page,
            totalPages: totalPages
         });

    } catch (err) {
        console.error("Error in getUpcomingMovies:", err);
        const message = err.response?.data?.status_message || err.message || 'Server error';
        res.status(500).json({ success: false, message: `Server error fetching upcoming movies: ${message}` });
    }
};

// --- CORRECTED getMovieDetails function ---
export const getMovieDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const apiKey = process.env.TMDB_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ success: false, message: "TMDB API Key not found." });
        }
        if (!id) {
            return res.status(400).json({ success: false, message: "Movie ID is required." });
        }

        // Fetch main details, appending videos and credits
        // *** REMOVED the leading period here ***
        const movieDetailsUrl = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US&append_to_response=videos,credits`;

        const response = await fetch(movieDetailsUrl); // Using fetch

        if (!response.ok) {
            return res.status(response.status).json({ success: false, message: `TMDB API error fetching details: ${response.statusText}` });
        }
        const movieData = await response.json();
        res.json({ success: true, data: movieData });

    } catch (err) {
        console.error("Error fetching movie details from TMDB:", err);
        res.status(500).json({ success: false, message: 'Server error fetching movie details' });
    }
};
// --- END CORRECTION ---