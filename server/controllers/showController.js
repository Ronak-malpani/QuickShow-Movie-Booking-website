import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// --- TMDB Configuration (Base URL) ---
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY; 

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async(req,res)=>{
    try{
        // ❌ FIX: Removed the {headers: {Authorization: Bearer...}} and use query parameter
        const {data} =await axios.get(
            `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`
        );

        // Data filtering and structuring for safe frontend rendering
        const rawMovies = data.results || [];
        
        const safeMovies = rawMovies
            .filter(m => m.poster_path && m.title) 
            .map(m => ({
                id: m.id,
                title: m.title,
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path,
                release_date: m.release_date,
                vote_average: m.vote_average,
                // Ensure genres is a safe empty array for MovieCard.jsx
                genres: [], 
            }));

        res.json({success:true,movies:safeMovies})
    }catch(error){
        console.error(error);
        res.status(error.response?.status || 500).json({success:false,message:error.message})
    }
}

//API to add a new show to database
export const addShow = async (req,res)=>{
    try{
        const {movieId, showsInput, showPrice} = req.body

        let movie = await Movie.findById(movieId)

        if(!movie){
            //Fetch movie details and credits from TMDB API
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`),
                axios.get(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`)
            ]);

            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;

            const movieDetails = {
                _id: movieId,
                title:movieApiData.title,
                overview:movieApiData.overview,
                poster_path:movieApiData.poster_path,
                backdrop_path:movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }
            //Add movie to the database
            movie = await Movie.create(movieDetails);
        }

        const showsToCreate =[];
        showsInput.forEach(show => {
            const showDate=show.date;
            show.time.forEach((time)=>{
                    const dateTimeString = `${showDate}T${time}`;
                    showsToCreate.push({
                        movie:movieId,
                        showDateTime: new Date(dateTimeString),
                        showPrice,
                        occupiedSeats: {}
                    })
            })
        });

        if(showsToCreate.length >0){
            await Show.insertMany(showsToCreate);
        }
        res.json({success:true,message:'Show Added successfully'})
    }catch(error){
        console.error(error);
        res.status(500).json({success:false,message:error.message})
    }
}
//API to get all shows from the database
export const getShows = async(req,res)=>{
    try{
        const shows = await Show.find({showDateTime:{$gte: new Date()}}).populate('movie').sort({showDateTime:1});

        //filter unique shows
        const uniqueShows = new Set(shows.map(show=>show.movie))

        res.json({success: true,shows: Array.from(uniqueShows)}) 
    }
    catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

//API to get a single show from the database
export const getShow=async (req,res)=>{
    try{
        const {movieId} = req.params;
        //get all upcoming shows for the movie
        const shows= await Show.find({movie:movieId,showDateTime:{$gte:new Date() }})

        const movie =await Movie.findById(movieId);
        const dateTime ={};

        shows.forEach((show)=>{
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date] = []
            }
            // Push an object containing both time and showId for the frontend
            dateTime[date].push({time:show.showDateTime.toTimeString().split(' ')[0].slice(0,5),showId:show._id})
        })
        
        // Return movie data and the processed schedule
        res.json({success:true,movie,dateTime})
    }
    catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}