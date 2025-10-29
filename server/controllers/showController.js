// File: server/controllers/showController.js

import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import Theater from '../models/Theater.js'; // Import Theater model
import { inngest } from "../inngest/index.js";

// Fetches 50 local movies for the admin panel & fixes vote_average
export const getNowPlayingMovies = async (req, res) => {
    console.log("Fetching movies from LOCAL database for admin panel...");
    try {
        const localMovies = await Movie.find({ 
            poster_path: { $ne: null, $ne: "" } 
        }).sort({ release_date: -1 }).limit(50);

        const formattedMovies = localMovies.map(movie => {
            const movieObject = movie.toObject();
            movieObject.id = movieObject._id; 

            let voteAvg = 0;
            if (Array.isArray(movieObject.vote_average) && movieObject.vote_average.length > 0) {
                if (movieObject.vote_average[0] && typeof movieObject.vote_average[0] === 'object' && movieObject.vote_average[0]['$numberInt']) {
                    voteAvg = parseFloat(movieObject.vote_average[0]['$numberInt']);
                } else if (typeof movieObject.vote_average[0] === 'number') {
                    voteAvg = movieObject.vote_average[0];
                }
            } else if (typeof movieObject.vote_average === 'number') {
                voteAvg = movieObject.vote_average;
            }
            movieObject.vote_average = voteAvg;

            movieObject.vote_count = movieObject.vote_count || 0;
            movieObject.release_date = movieObject.release_date || 'N/A';
            
            return movieObject;
        });

        console.log(`Found ${formattedMovies.length} local movies with posters.`);
        res.json({ success: true, movies: formattedMovies });
    } catch (error) {
        console.error("Error fetching local movies:", error);
        res.status(500).json({ success: false, message: "Failed to fetch local movies." });
    }
};

// Adds a single show
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice, theaterId } = req.body;
        if (!theaterId) {
            return res.status(400).json({ success: false, message: "Theater ID is required." });
        }
        let movie = await Movie.findById(movieId);
        if (!movie) {
            const movieDetailsResponse = await axios.get(
              `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=videos,credits`
            );
            const movieData = movieDetailsResponse.data;
            const castData = movieData.credits?.cast || [];
            const videoData = movieData.videos;
            movie = await Movie.create({
                _id: movieId,
                title: movieData.title,
                overview: movieData.overview,
                poster_path: movieData.poster_path,
                backdrop_path: movieData.backdrop_path,
                genres: movieData.genres,
                casts: castData,
                release_date: movieData.release_date,
                original_language: movieData.original_language,
                tagline: movieData.tagline || "",
                vote_average: movieData.vote_average,
                runtime: movieData.runtime,
                videos: videoData,
            });
        }
        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach(time => {
                showsToCreate.push({
                    movie: movieId,
                    theater: theaterId,
                    showDateTime: new Date(`${showDate}T${time}`),
                    showPrice,
                    occupiedSeats: {}
                });
            });
        });
        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }
        inngest.send({ name: "app/show.added", data: { movieTitle: movie.title } })
          .catch(err => console.error("Inngest send error:", err));
        res.json({ success: true, message: "Show added successfully" });
    } catch (error) {
        console.error("Error in addShow:", error);
        res.status(500).json({ success: false, message: "Failed to add show. " + error.message });
    }
};

// --- THIS IS THE FIXED getShows FUNCTION (NO PAGINATION) ---
export const getShows = async (req, res) => {
    try {
        const filter = { showDateTime: { $gte: new Date() } };
        const { theaterId } = req.query;

        if (theaterId) {
            filter.theater = theaterId;
            console.log(`Filtering shows for theater: ${theaterId}`);
        } else {
            console.log("Fetching all unique upcoming movies.");
        }

        // 1. Find all shows matching the filter (upcoming and optionally by theater)
        // 2. Populate the 'movie' field to get movie details
        const shows = await Show.find(filter)
                                 .populate('movie') 
                                 .sort({ showDateTime: 1 });

        // 3. Get a unique list of movies from the filtered shows
        const uniqueMovies = new Map();
        shows.forEach(show => {
            // Only add if the movie exists (wasn't deleted) and is populated
            if (show.movie) {
                uniqueMovies.set(show.movie._id.toString(), show.movie);
            }
        });

        // 4. Fetch the theater details if we were filtering
        let theaterDetails = null;
        if (theaterId) {
            theaterDetails = await Theater.findById(theaterId);
        }

        // 5. Send the unique movies (and theater, if any)
        res.json({
            success: true,
            shows: Array.from(uniqueMovies.values()), // The list of unique movies
            theater: theaterDetails 
        });
        
    } catch (error) {
        console.error("Error in getShows:", error);
        res.status(500).json({ success: false, message: "Server error fetching shows." });
    }
};
// --- END OF FIXED FUNCTION ---

// Gets showtimes for one movie, OR filters by theaterId
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { theaterId } = req.query; 

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const showFilter = {
            movie: movieId,
            showDateTime: { $gte: today }
        };

        if (theaterId) {
            console.log(`Getting shows for movie ${movieId} AT theater ${theaterId}`);
            showFilter.theater = theaterId;
        } else {
            console.log(`Getting all shows for movie ${movieId}`);
        }

        const shows = await Show.find(showFilter).sort({ showDateTime: 1 });

        const dateTime = {};
        shows.forEach(show => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if (!dateTime[date]) dateTime[date] = [];
            dateTime[date].push({
                time: show.showDateTime.toISOString(),
                showId: show._id,
                theater: show.theater 
            });
        });

        Object.keys(dateTime).forEach(date => {
            dateTime[date].sort((a, b) => new Date(a.time) - new Date(b.time));
        });

        const todayUtcString = new Date().toISOString().split('T')[0];
        const filteredDateTime = {};
        Object.keys(dateTime).forEach(dateKey => {
            if (dateKey >= todayUtcString) {
                filteredDateTime[dateKey] = dateTime[dateKey];
            }
        });

        res.json({ success: true, movie, dateTime: filteredDateTime });
    } catch (error) {
        console.error("Error in getShow:", error);
        res.status(500).json({ success: false, message: "Server error fetching show details." });
    }
};

// addShowsBulk (legacy)
export const addShowsBulk = async (req, res) => {
    try {
        const moviesInput = req.body.movies; 

        if (!Array.isArray(moviesInput) || moviesInput.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid input: 'movies' array is required." });
        }

        let addedCount = 0;
        let skippedCount = 0;
        const allShowsToCreate = [];

        for (const movieData of moviesInput) {
            const { movieId, showsInput, showPrice, theaterId } = movieData;

            if (!movieId || !showsInput || !showPrice || !theaterId) {
                console.warn("Skipping invalid movie data in bulk add:", movieData);
                skippedCount++;
                continue;
            }

            let movie = await Movie.findById(movieId);
            if (!movie) {
                try {
                    const movieDetailsResponse = await axios.get(
                      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=videos,credits`
                    );
                    const movieDataFetched = movieDetailsResponse.data;
                    const castData = movieDataFetched.credits?.cast || [];
                    const videoData = movieDataFetched.videos;

                    movie = await Movie.create({
                        _id: movieId,
                        title: movieDataFetched.title,
                        overview: movieDataFetched.overview,
                        poster_path: movieDataFetched.poster_path,
                        backdrop_path: movieDataFetched.backdrop_path,
                        genres: movieDataFetched.genres,
                        casts: castData,
                        release_date: movieDataFetched.release_date,
                        original_language: movieDataFetched.original_language,
                        tagline: movieDataFetched.tagline || "",
                        vote_average: movieDataFetched.vote_average,
                        runtime: movieDataFetched.runtime,
                        videos: videoData,
                    });
                } catch (tmdbError) {
                    console.error(`Failed to fetch TMDB data for movieId ${movieId}:`, tmdbError.message);
                    skippedCount++;
                    continue;
                }
            }

            showsInput.forEach(show => {
                const showDate = show.date;
                show.time.forEach(time => {
                    allShowsToCreate.push({
                        movie: movieId,
                        theater: theaterId,
                        showDateTime: new Date(`${showDate}T${time}`),
                        showPrice,
                        occupiedSeats: {}
                    });
                });
            });

            if (showsInput.length > 0 && showsInput.length > 0 && showsInput[0].time && showsInput[0].time.length > 0) {
                addedCount++;
            } else {
                skippedCount++;
            }
        } // End of loop

        if (allShowsToCreate.length > 0) {
            await Show.insertMany(allShowsToCreate);
        }

        res.json({ success: true, message: `Bulk add complete. Added/updated shows for ${addedCount} movies, skipped ${skippedCount}.` });

    } catch (error) {
        console.error("Error in addShowsBulk:", error);
        res.status(500).json({ success: false, message: "Bulk add failed. " + error.message });
    }
};


// NEW Function for cross-adding movies/theaters
export const addShowsCrossTheaters = async (req, res) => {
    try {
        const { movieIds, theaterIds, showsInput, showPrice } = req.body;

        if (!Array.isArray(movieIds) || movieIds.length === 0 ||
            !Array.isArray(theaterIds) || theaterIds.length === 0 ||
            !Array.isArray(showsInput) || showsInput.length === 0 ||
            !showPrice) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const allShowsToCreate = [];
        let moviesFetchedCount = 0;

        for (const movieId of movieIds) {
            let movie = await Movie.findById(movieId);
            if (!movie) {
                try {
                    const movieDetailsResponse = await axios.get(
                      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,videos`
                    );
                    const movieData = movieDetailsResponse.data;
                    const castData = movieData.credits?.cast || [];
                    const videoData = movieData.videos;
                    movie = await Movie.create({
                        _id: movieId,
                        title: movieData.title,
                        overview: movieData.overview,
                        poster_path: movieData.poster_path,
                        backdrop_path: movieData.backdrop_path,
                        genres: movieData.genres,
                        casts: castData,
                        release_date: movieData.release_date,
                        original_language: movieData.original_language,
                        tagline: movieData.tagline || "",
                        vote_average: movieData.vote_average,
                        runtime: movieData.runtime,
                        videos: videoData,
                    });
                    moviesFetchedCount++;
                } catch (tmdbError) {
                    console.error(`Failed to fetch or create movie ${movieId}:`, tmdbError.message);
                    continue; 
                }
            }

            for (const theaterId of theaterIds) {
                showsInput.forEach(show => {
                    const showDate = show.date;
                    show.time.forEach(time => {
                        allShowsToCreate.push({
                            movie: movieId,
                            theater: theaterId,
                            showDateTime: new Date(`${showDate}T${time}`),
                            showPrice: Number(showPrice),
                            occupiedSeats: {}
                        });
                    });
                });
            }

            if (movie) {
                inngest.send({ name: "app/show.added", data: { movieTitle: movie.title } })
                   .catch(err => console.error(`Inngest send error for ${movie.title}:`, err));
            }
        }

        let showDocumentsCreated = 0;
        if (allShowsToCreate.length > 0) {
            await Show.insertMany(allShowsToCreate);
            showDocumentsCreated = allShowsToCreate.length;
        }

        res.json({
            success: true,
            message: `Successfully created ${showDocumentsCreated} shows for ${movieIds.length} movie(s) across ${theaterIds.length} theater(s). ${moviesFetchedCount} new movies fetched.`
        });

    } catch (error) {
        console.error("Error in addShowsCrossTheaters:", error);
        res.status(500).json({ success: false, message: "Bulk cross-add failed. " + error.message });
    }
};