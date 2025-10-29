// File: src/pages/Release.jsx

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CalendarDays, PlayCircle } from 'lucide-react'; // Removed unused icons

const Release = () => {
    const [upcomingMovies, setUpcomingMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // For initial load
    const [isLoadingMore, setIsLoadingMore] = useState(false); // For loading subsequent pages
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // Track current page number fetched
    const [totalPages, setTotalPages] = useState(1); // Track total pages available from API

    const { image_base_url } = useAppContext();

    // Use useCallback to memoize the fetch function to prevent unnecessary re-renders
    const fetchUpcomingReleases = useCallback(async (pageToFetch) => {
        // Set appropriate loading state based on which page is being fetched
        if (pageToFetch === 1) {
            setIsLoading(true); // Initial page load
        } else {
            setIsLoadingMore(true); // Loading more pages
        }
        setError(null); // Reset error state on new fetch

        try {
            // Fetch data for the requested page from the backend
            const response = await fetch(`/api/movies/upcoming?page=${pageToFetch}`);
            if (!response.ok) {
                // Throw an error if the HTTP response is not ok
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Check if the response indicates success and contains valid data
            if (data.success && Array.isArray(data.data)) {
                // Filter out movies that don't have a poster path
                const newMovies = data.data.filter(movie => movie.poster_path);

                // If fetching the first page, replace movies; otherwise, append
                setUpcomingMovies(prevMovies =>
                    pageToFetch === 1 ? newMovies : [...prevMovies, ...newMovies]
                );
                // Update pagination state based on the backend response
                setCurrentPage(data.page);
                setTotalPages(data.totalPages);

            } else {
                // Throw error if backend response structure is invalid or success is false
                throw new Error(data.message || "Invalid data structure received from server.");
            }
        } catch (err) {
            console.error(`Error fetching upcoming releases page ${pageToFetch}:`, err);
            setError(err.message); // Set error state to display message
            toast.error(`Error fetching movies: ${err.message}`);
            // Only clear movies if the *initial* fetch failed
            if (pageToFetch === 1) setUpcomingMovies([]);
        } finally {
            // Reset both loading states regardless of success or failure
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []); // This useCallback has no external dependencies from component scope

    // Effect to trigger the initial fetch (page 1) when the component mounts
    useEffect(() => {
        fetchUpcomingReleases(1);
    }, [fetchUpcomingReleases]); // Dependency array includes the memoized fetch function

    // Handler function for the "Load More" button
    const handleLoadMore = () => {
        // Fetch the next page only if not currently loading and if there are more pages
        if (!isLoadingMore && currentPage < totalPages) {
            fetchUpcomingReleases(currentPage + 1);
        }
    };

    // --- RENDER LOGIC ---

    // Display loading spinner only during the initial load
    if (isLoading) {
        return <Loading />;
    }

    // Display error message only if the initial load failed and no movies are loaded
    if (error && upcomingMovies.length === 0) {
        return (
            <div className="text-center text-red-500 pt-28 px-4">
                <h2 className="text-2xl font-semibold mb-4">Oops! Something went wrong.</h2>
                <p className="text-lg">{error}</p>
                <p className="text-base mt-2">Please try refreshing the page.</p>
            </div>
        );
    }

    // Determine if there are more pages available to load
    const hasMorePages = currentPage < totalPages;

    return (
        <div className='min-h-screen bg-gray-900 text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-5xl mx-auto'>
                <h1 className='text-4xl font-bold text-center mb-10 tracking-wider text-primary'>Upcoming Releases 📅</h1>

                {/* Display message if no movies found (after initial load) */}
                {upcomingMovies.length === 0 && !isLoading ? (
                    <p className='text-center text-gray-400 text-lg mt-10'>No upcoming releases found at this time.</p>
                ) : (
                    <>
                        {/* Grid layout for movie cards */}
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                            {upcomingMovies.map((movie) => {
                                const posterPath = movie.poster_path;
                                const fullImageUrl = posterPath && image_base_url
                                    ? `${image_base_url}${posterPath}`
                                    : '/path/to/default/poster.png'; // Ensure this fallback image exists

                                // Safer date formatting for release date
                                let formattedReleaseDate = 'TBA';
                                if (movie.release_date) {
                                    try {
                                        // Replace hyphens for cross-browser compatibility
                                        const releaseDate = new Date(movie.release_date.replace(/-/g, '/'));
                                        if (!isNaN(releaseDate)) {
                                            formattedReleaseDate = releaseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                        }
                                    } catch (e) { console.error("Error parsing date:", movie.release_date)}
                                }

                                // Use TMDB 'id' as the primary identifier
                                const movieId = movie.id;

                                return (
                                    // Movie Card
                                    <div key={`${movieId}-${currentPage}`} // Ensure key is unique across pages
                                         className='bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-103 transition-all duration-300 border border-gray-700 hover:border-primary-dull relative'>
                                        <Link to={`/movies/${movieId}`} className='block'>
                                            {/* Image container */}
                                            <div className='relative h-64'>
                                                <img
                                                    src={fullImageUrl}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover object-center"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/path/to/default/poster.png'; }}
                                                />
                                                {/* Title overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                                                    <h2 className='text-xl font-bold text-white leading-tight'>{movie.title}</h2>
                                                </div>
                                            </div>
                                            {/* Text content */}
                                            <div className='p-4 space-y-2'>
                                                {/* Release Date display */}
                                                <p className='flex items-center text-sm text-gray-300'>
                                                    <CalendarDays className='w-4 h-4 mr-2 text-primary flex-shrink-0' />
                                                    <span>Release Date: {formattedReleaseDate}</span>
                                                </p>
                                                {/* Overview text (clamped to 3 lines) */}
                                                <p className='text-gray-400 text-sm line-clamp-3'>
                                                    {movie.overview || 'No overview available.'}
                                                </p>
                                                {/* View Details link */}
                                                <div className="pt-2 text-primary hover:text-primary-dull flex items-center justify-end text-sm font-medium">
                                                    View Details <PlayCircle className="w-4 h-4 ml-1.5" />
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>

                        {/* --- Load More Button --- */}
                        <div className="flex justify-center mt-12">
                            {/* Show button only if more pages exist */}
                            {hasMorePages && (
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore} // Disable while loading more
                                    className="px-6 py-2 bg-primary hover:bg-primary-dull text-white font-medium rounded-md transition duration-300 disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isLoadingMore ? 'Loading...' : 'Load More Movies'}
                                </button>
                            )}
                            {/* Show end message if no more pages and movies exist */}
                            {!hasMorePages && upcomingMovies.length > 0 && (
                                <p className="text-gray-500">You've reached the end!</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Release;