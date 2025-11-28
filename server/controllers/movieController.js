import axios from "axios";
import querystring from 'querystring';
import Movie from "../models/Movie.js"; // Included for MongoDB model context

// --- TMDB Configuration ---
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY; 

if (!TMDB_API_KEY) {
    console.error("CRITICAL: TMDB_API_KEY environment variable is not set.");
}
// ---------------------------------------------

/**
 * Helper function for the free synopsis web search fallback.
 */
const fetchSynopsisFromWeb = async (title) => {
    // This uses the free DuckDuckGo Zero-Click API (no key required).
    const params = { q: `${title} movie synopsis`, format: 'json', no_html: 1 };
    const ddgUrl = 'https://api.duckduckgo.com/?' + querystring.stringify(params);

    try {
        const response = await axios.get(ddgUrl);
        const data = response.data;
        
        if (data.Abstract && data.Abstract.length > 50) return data.Abstract;
        if (data.RelatedTopics && data.RelatedTopics[0] && data.RelatedTopics[0].Text) return data.RelatedTopics[0].Text;
        return null;
    } catch (error) {
        console.error("DuckDuckGo Search failed:", error.message);
        return null;
    }
};

// ---------------------------------
// 1. LIST CONTROLLERS
// ---------------------------------

/**
 * Fetches Now Playing movies (GLOBAL LIST) - Route: /api/movies/now-playing
 */
export const fetchNowPlaying = async (req, res) => {
    try {
        const pageNumber = req.query.page || 1;

        const response = await axios.get(
            `${TMDB_BASE_URL}/movie/now_playing`,
            { params: { api_key: TMDB_API_KEY, language: "en-US", page: pageNumber } }
        ); 

        const rawMovies = response.data.results || [];
        
        // Filter and Format for Frontend Safety
        const safeMovies = rawMovies
            .filter(m => m.poster_path && m.title) 
            .map(m => ({
                id: m.id,
                title: m.title,
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path,
                release_date: m.release_date,
                vote_average: m.vote_average,
                overview: m.overview,
                genres: [], // CRITICAL FIX: Safe array for MovieCard
            }));

        return res.json({ 
            success: true, movies: safeMovies, page: response.data.page,
            total_pages: response.data.total_pages
        });
    } catch (error) {
        console.error("NOW PLAYING ERROR:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load now playing movies." });
    }
};

/**
 * Fetches Upcoming movies (LIST VIEW) - Route: /api/movies/upcoming
 * This fixes the 404 error you were seeing.
 */
export const fetchUpcomingMovies = async (req, res) => {
    try {
        const pageNumber = req.query.page || 1;
        
        // --- Fetch data from TMDB ---
        const response = await axios.get(
            `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${pageNumber}`
        ); 

        const rawMovies = response.data.results || [];
        
        // --- Filter and Format for Frontend Safety ---
        const safeMovies = rawMovies
            .filter(m => m.poster_path && m.title) // Filter incomplete visuals
            .map(m => ({
                id: m.id,
                title: m.title,
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path,
                release_date: m.release_date,
                vote_average: m.vote_average,
                overview: m.overview,
                genres: Array.isArray(m.genres) ? m.genres : [], // Ensure safe genre array
            }));

        return res.json({ 
            success: true, 
            movies: safeMovies, 
            page: response.data.page,
            total_pages: response.data.total_pages
        });
    } catch (error) {
        console.error("UPCOMING MOVIES ERROR:", error.message);
        return res.status(500).json({ success: false, message: "Failed to load upcoming movies from API." });
    }
};

// ---------------------------------
// 2. DETAIL CONTROLLER (with Fallback)
// ---------------------------------

/**
 * Fetches detailed information for a single movie (DETAILS VIEW) - Route: /api/movies/:movieId
 */
export const fetchMovieDetails = async (req, res) => {
    try {
        const movieId = req.params.movieId;

        // 1. Fetch details and credits in parallel
        const [detailsResponse, creditsResponse] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`),
            axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`),
        ]);

        const details = detailsResponse.data;
        const credits = creditsResponse.data;

        const fullCast = credits.cast.slice(0, 10).map((c) => ({
            id: c.id, name: c.name, character: c.character, profile_path: c.profile_path,
        }));
        const director = credits.crew.find(c => c.job === 'Director');

        let movieData = {
            id: details.id, title: details.title, tagline: details.tagline,
            overview: details.overview, runtime: details.runtime, 
            release_date: details.release_date, vote_average: details.vote_average,
            genres: details.genres.map(g => g.name), poster_path: details.poster_path, 
            backdrop_path: details.backdrop_path, director: director ? director.name : 'N/A',
            cast: fullCast,
        };

        // 2. Conditional Fallback for Synopsis (If TMDB overview is missing)
        if (!movieData.overview || movieData.overview.length < 50) {
            const webSynopsis = await fetchSynopsisFromWeb(movieData.title);
            if (webSynopsis) {
                movieData.overview = `(Web Fallback) ${webSynopsis}`;
            }
        }
        
        return res.json({ success: true, movie: movieData });
    } catch (err) {
        console.error("MOVIE DETAILS ERROR:", err.message);
        // Handle 404 errors for non-existent movies
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }
        return res.status(500).json({ success: false, message: "Failed to load movie details." });
    }
};