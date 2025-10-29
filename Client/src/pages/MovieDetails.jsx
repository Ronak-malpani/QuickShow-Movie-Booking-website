// File: src/pages/MovieDetails.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // 1. Import
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon, CalendarDays, X } from 'lucide-react';
import timeformat from '../lib/timeformat';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MovieCard';
import Loading from '../components/Loading';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';
import ReactPlayer from 'react-player/youtube';

const MovieDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams(); // 2. Get params
    const theaterId = searchParams.get('theaterId'); // Get theaterId

    const [show, setShow] = useState(null);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { shows, axios, getToken, user, fetchFavoriteMovies, favoriteMovies, image_base_url } = useAppContext();

    // 3. Update fetchLocalShowDetails
    const fetchLocalShowDetails = async (movieId) => {
        try {
            const apiUrl = theaterId 
                ? `/api/show/${movieId}?theaterId=${theaterId}`
                : `/api/show/${movieId}`;
            const { data } = await axios.get(apiUrl);
            
            if (data.success && data.movie) return data;
            return null;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                 console.log("Movie/Show not found in local DB.");
                 return null;
            }
            console.error("Error fetching local show details:", err);
            throw err;
        }
    };

    const fetchTmdbMovieDetails = async (movieId) => {
        try {
            const { data } = await axios.get(`/api/movies/${movieId}`);
            if (data.success && data.data) {
                const movieData = data.data;
                if (data.data.credits && data.data.credits.cast) {
                    movieData.casts = data.data.credits.cast;
                }
                return { movie: movieData, dateTime: {} };
            } else {
                throw new Error(data.message || "Failed to fetch TMDB movie details.");
            }
        } catch (err) {
            console.error("Error fetching TMDB movie details:", err);
            throw err;
        }
    };

    useEffect(() => {
        const loadMovieDetails = async () => {
            setIsLoading(true);
            setError(null);
            setShow(null);
            try {
                const localData = await fetchLocalShowDetails(id);
                if (localData) {
                    setShow(localData);
                } else {
                    const tmdbData = await fetchTmdbMovieDetails(id);
                    setShow(tmdbData);
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || "An error occurred.";
                console.error("Final error fetching details:", err);
                toast.error(`Failed to load details: ${errorMsg}`);
                setError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) loadMovieDetails();
    }, [id, theaterId]); // 4. Add theaterId to dependency array

    // --- CORRECTED handleFavorite function ---
    const handleFavorite = async () => {
         try {
             if (!user) return toast.error("Please login to proceed");
             const { data } = await axios.post('/api/user/update-favorite', { movieId: id }, {
                 headers: { Authorization: `Bearer ${await getToken()}` }
             });
             if (data.success) {
                 await fetchFavoriteMovies();
                 toast.success(data.message);
             }
         } catch (error) {
             console.error("Error updating favorites:", error);
             toast.error("Failed to update favorites.");
         }
    };

    if (isLoading) return <Loading />;
    if (error) return <div className="text-center text-red-500 pt-28 px-4 text-lg">{error}</div>;
    if (!show || !show.movie) return <div className="text-center text-gray-400 pt-28 px-4 text-lg">Movie details could not be loaded.</div>;

    const releaseDate = show.movie.release_date ? new Date(show.movie.release_date.replace(/-/g, '/')) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isReleased = releaseDate && !isNaN(releaseDate) ? releaseDate <= today : false;
    const formattedReleaseDate = releaseDate && !isNaN(releaseDate)
        ? releaseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'TBA';
    const hasShowtimes = show.dateTime && Object.keys(show.dateTime).length > 0;

    return (
        <div className='px-6 md:px-16 lg:px-40 pt-30 md:pt-40 pb-20'>
            {/* --- Movie Header --- */}
            <div className='flex flex-col md:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto'>
                <img
                     src={image_base_url + show.movie.poster_path}
                     alt={show.movie.title}
                     className='max-md:mx-auto rounded-xl h-96 md:h-[30rem] lg:h-[34rem] max-w-xs object-cover shadow-lg'
                     onError={(e) => { e.target.onerror = null; e.target.src = '/path/to/default/poster.png'; }} />
                <div className='relative flex flex-col gap-3 flex-1'>
                    <BlurCircle top="-100px" left="-100px" />
                    <p className='text-primary text-base font-medium'>{show.movie.original_language?.toUpperCase() || "ENGLISH"}</p>
                    <h1 className='text-4xl md:text-5xl lg:text-6xl font-semibold text-white text-balance'>{show.movie.title}</h1>
                    {isReleased && show.movie.vote_average > 0 && (
                         <div className='flex items-center gap-2 text-gray-300'>
                             <StarIcon className="w-5 h-5 text-primary fill-primary" />
                             {Number(show.movie.vote_average)?.toFixed(1)}
                         </div>
                    )}
                    <p className='text-gray-300 mt-2 text-lg leading-relaxed max-w-xl'>{show.movie.overview}</p>
                     <p className='text-gray-400 mt-1 text-base'>
                         {timeformat(show.movie.runtime || 0)}
                         {show.movie.genres?.length > 0 && ` • ${show.movie.genres.map(g => g.name).join(", ")}`}
                         {releaseDate && !isNaN(releaseDate) ? ` • ${isReleased ? releaseDate.getFullYear() : formattedReleaseDate}` : ''}
                     </p>
                    <div className='flex items-center flex-wrap gap-4 mt-6'>
                        {show.movie.videos?.results?.length > 0 && (
                            <button onClick={() => setShowTrailer(true)}
                               className='flex items-center gap-2 px-6 py-3 text-base bg-gray-700 hover:bg-gray-600 transition rounded-md font-medium cursor-pointer active:scale-95'>
                               <PlayCircleIcon className="w-5 h-5" />Watch Trailer
                            </button>
                        )}
                        {isReleased && hasShowtimes && (
                            <a
                                href="#dateSelect"
                                className='px-8 py-3 text-base bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95'
                            >
                                Buy Tickets
                            </a>
                        )}
                        <button onClick={handleFavorite} className='bg-gray-700 hover:bg-gray-600 p-3 rounded-full transition cursor-pointer active:scale-95' title="Add to Favorites">
                            <Heart className={`w-5 h-5 ${favoriteMovies?.find(m => m._id === id || m.id === id) ? 'fill-primary text-primary' : "text-gray-300"}`} />
                        </button>
                    </div>

                    {/* --- Status Messages (Corrected) --- */}
                    {!isReleased && (
                         <div className="mt-8 bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                             <p className="font-semibold text-primary text-xl flex items-center justify-center gap-2">
                                 <CalendarDays className="w-5 h-5"/> Coming Soon!
                             </p>
                            <p className="text-gray-300 mt-1 text-base">Expected Release: {formattedReleaseDate}</p>
                            <p className="text-gray-400 text-sm mt-2">Booking options will be available upon release.</p>
                         </div>
                    )}
                    {isReleased && !hasShowtimes && (
                         <div className="mt-8 bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
                            <p className="font-semibold text-primary text-lg flex items-center justify-center gap-2">
                                <CalendarDays className="w-5 h-5"/> Released!
                            </p>
                            <p className="text-gray-400 text-sm mt-2">Showtimes for this movie are not yet available.</p>
                         </div>
                    )}
                    {/* --- End of Status Messages --- */}
                </div>
            </div>

            {/* --- Cast Section (Corrected) --- */}
            {show.movie.casts && show.movie.casts.length > 0 && (
                 <>
                     <p className='text-xl font-medium mt-16 mb-6 text-white'>Cast</p>
                     <div className='overflow-x-auto no-scrollbar pb-4'>
                         <div className='flex items-start gap-4 w-max'>
                             {show.movie.casts.slice(0, 12).map((cast, index) => (
                                 cast.profile_path && (
                                     <div key={cast.id || index} className='flex flex-col items-center text-center w-24'>
                                         <img
                                             src={image_base_url + cast.profile_path}
                                             alt={cast.name}
                                             className='rounded-full h-20 w-20 object-cover border-2 border-gray-700'
                                             onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                         />
                                         <p className='font-medium text-xs text-white mt-2 truncate w-full'>{cast.name}</p>
                                         <p className='text-gray-400 text-xs truncate w-full'>{cast.character}</p>
                                     </div>
                                 )
                             ))}
                         </div>
                    </div>
                 </>
            )}
            {/* --- End of Cast Section --- */}

            {/* --- SHOWTIMES SECTION (DateSelect) --- */}
            {isReleased && hasShowtimes && (
                <div id="dateSelect" className='pt-16'>
                    <DateSelect dateTime={show.dateTime} id={id} theaterId={theaterId} />
                </div>
            )}

             {/* --- Similar Movies Section (Corrected) --- */}
             {shows && shows.length > 0 && (
                 <>
                     <p className='text-xl font-medium mt-20 mb-8 text-white'>You May Also Like</p>
                     <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8'>
                         {shows.filter(m => m._id !== id).slice(0, 4).map((movie, index) => (
                             <MovieCard key={movie._id || movie.id || index} movie={movie} />
                         ))}
                     </div>
                     <div className='flex justify-center mt-16'>
                         <button onClick={() => { navigate('/movies'); window.scrollTo(0,0); }} className='px-8 py-3 text-base bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'>
                             View All Movies
                         </button>
                     </div>
                 </>
             )}
            {/* --- End of Similar Movies Section --- */}

            {/* --- Trailer Modal (Corrected) --- */}
            {showTrailer && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setShowTrailer(false)}>
                     <div className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                         <button onClick={() => setShowTrailer(false)} className="absolute top-2 right-2 z-10 p-1 bg-gray-800 rounded-full text-white hover:bg-gray-700">
                             <X className="w-5 h-5" />
                         </button>
                         <ReactPlayer
                             url={`https://www.youtube.com/watch?v=${show.movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || show.movie.videos?.results?.find(v => v.site === 'YouTube')?.key || ''}`}
                             width="100%"
                             height="100%"
                             playing={true}
                             controls={true}
                             onError={(e) => { console.error('ReactPlayer error:', e); toast.error("Could not load trailer."); setShowTrailer(false); } }
                         />
                     </div>
                 </div>
             )}
            {/* --- End of Trailer Modal --- */}
        </div>
    );
};

export default MovieDetails;