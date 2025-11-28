import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon, BellIcon, CalendarCheck } from 'lucide-react';
import timeformat from '../lib/timeformat';
import Loading from '../components/Loading';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const UpcomingMovieDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // This is the TMDB ID (number/string)

    const [movieData, setMovieData] = useState(null);
    const {
        axios: appAxios,
        getToken,
        user,
        fetchFavoriteMovies,
        favoriteMovies,
        image_base_url
    } = useAppContext();

    const getMovieData = async () => {
        try {
            // Using the new API endpoint: /api/movies/:id (This must be correctly mapped in the backend)
            const { data } = await appAxios.get(`/api/movies/${id}`);

            if (data.success) {
                 setMovieData(data.movie);
            }
        } catch (error) {
            console.error("Error fetching upcoming movie details:", error);
            setMovieData(false);
            toast.error("Failed to load movie details. Please check server or movie ID.");
        }
    };

    const handleFavorite = async () => {
        try {
            if (!user) return toast.error("Please Login to proceed");
            const { data } = await appAxios.post(
                '/api/user/update-favorite',
                { movieId: id },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );
            if (data.success) {
                await fetchFavoriteMovies();
                toast.success(data.message);
            }
        } catch (error) {
            console.error("Error updating favorite:", error);
        }
    };

    const handleNotifyMe = () => {
        if (!user) return toast.error("Please Login to set a notification.");
        toast.success(`You will be notified when ${movieData.title} is released!`);
    };

    useEffect(() => {
        getMovieData();
    }, [id]);

    if (movieData === null) return <Loading />;
    if (movieData === false) return <div className="p-20 text-center text-red-500 bg-[#0F0F1A] min-h-screen">Failed to load movie details.</div>;

    const movie = movieData;
    
    // FIX: Compare the route ID (TMDB ID) against the stored movie ID field
    const isFavorite = favoriteMovies.some(favMovie => 
        String(favMovie.movieId) === String(id)
    );

    return (
        <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 min-h-screen bg-[#0F0F1A] text-white">
            <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
                {/* Poster */}
                <img
                    src={movie.poster_path ? image_base_url + movie.poster_path : '/placeholder.png'}
                    alt={movie.title}
                    className="max-md:mx-auto rounded-xl h-[416px] max-w-[280px] object-cover shadow-2xl shadow-yellow-500/30"
                />

                {/* Details */}
                <div className="relative flex flex-col gap-3 flex-1">
                    <BlurCircle top="-100px" left="-100px" />

                    {/* Status Tag - Clearly Upcoming */}
                    <p className="text-sm font-semibold uppercase text-yellow-400 flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5"/> UPCOMING RELEASE
                    </p>

                    <h1 className="text-5xl font-extrabold max-w-3xl leading-tight text-balance">{movie.title}</h1>

                    {/* Rating & Release Date */}
                    <div className="flex items-center gap-4 text-gray-300">
                        <div className="flex items-center gap-2">
                            <StarIcon className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                            <span className="text-xl font-bold">
                                {movie.vote_average ? Number(movie.vote_average).toFixed(1) : "N/A"}
                            </span>
                        </div>
                        <p className="text-lg font-medium text-gray-400">
                            Expected: {movie.release_date || 'TBD'}
                        </p>
                    </div>

                    {/* Overview */}
                    <p className="text-gray-400 mt-2 text-base leading-relaxed max-w-xl">{movie.overview || 'Synopsis coming soon.'}</p>

                    {/* Meta Data */}
                    <p className="text-gray-300 text-sm mt-2">
                        {movie.runtime ? `Runtime: ${timeformat(movie.runtime)}` : 'Runtime: TBD'}
                        {' • '}
                        {movie.genres?.length ? movie.genres.join(', ') : 'Genres: N/A'}
                        {' • '}
                        Director: **{movie.director || 'N/A'}**
                    </p>

                    {/* Action Buttons (Upcoming Focus) */}
                    <div className="flex items-center flex-wrap gap-4 mt-6">

                        {/* Notify Me Button */}
                        <button
                            onClick={handleNotifyMe}
                            className="flex items-center gap-2 px-7 py-3 text-base bg-yellow-600 hover:bg-yellow-700 transition rounded-md font-bold cursor-pointer active:scale-95 shadow-lg shadow-yellow-600/50"
                        >
                            <BellIcon className="w-5 h-5" />
                            Get Notified on Release
                        </button>

                        {/* Watch Trailer Button */}
                        <button
                            onClick={() =>
                                movie.trailer
                                    ? window.open(movie.trailer, '_blank')
                                    : toast.error('Trailer not yet available.')
                            }
                            className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-700 transition rounded-md font-medium cursor-pointer active:scale-95 border border-gray-700"
                        >
                            <PlayCircleIcon className="w-5 h-5 text-red-500" />
                            Watch Trailer
                        </button>


                        {/* Favorite Button (Common) */}
                        <button
                            onClick={handleFavorite}
                            className="bg-gray-700 p-3 rounded-full transition cursor-pointer hover:bg-gray-600 active:scale-95"
                        >
                            <Heart
                                className={`w-5 h-5 ${
                                    isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                                }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-2xl font-semibold mt-20">Cast & Crew</p>
            <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
                <div className="flex items-center gap-6 w-max">
                    {movie.cast?.slice(0, 12).map((cast, index) => (
                        <div key={index} className="flex flex-col items-center text-center w-[100px] flex-shrink-0">
                            <img
                                src={cast.profile_path ? image_base_url + cast.profile_path : '/placeholder.png'}
                                alt={cast.name}
                                className="rounded-full h-24 w-24 object-cover border-2 border-yellow-500/50"
                            />
                            <p className="font-medium text-sm mt-3 truncate w-full">{cast.name}</p>
                            <p className="text-xs text-gray-400 truncate w-full">{cast.character}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations (Placeholder) */}
            <p className="text-2xl font-semibold mt-20 mb-8">Other Exciting Upcoming Movies</p>
            <div className="flex flex-wrap max-sm:justify-center gap-8">
                {/* Render MovieCard components for other upcoming movies */}
            </div>

            <div className="flex justify-center mt-20">
                <button
                    onClick={() => {
                        navigate('/releases'); // Navigates back to the main releases list
                        window.scrollTo(0, 0);
                    }}
                    className="px-10 py-3 text-base bg-yellow-600 hover:bg-yellow-700 transition rounded-md font-bold cursor-pointer shadow-lg shadow-yellow-600/30"
                >
                    View All Upcoming
                </button>
            </div>
        </div>
    );
};

export default UpcomingMovieDetails;