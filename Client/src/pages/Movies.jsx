// File: src/pages/Movies.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import BlurCircle from '../components/BlurCircle';
import Loading from '../components/Loading';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';
import { MapPinIcon, ChevronDown } from 'lucide-react'; // Import ChevronDown

const Movies = () => {
    const { axios } = useAppContext(); 
    const [searchParams] = useSearchParams();
    const theaterId = searchParams.get('theaterId'); 

    const [movies, setMovies] = useState([]);
    const [theater, setTheater] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // We use useCallback to prevent the effect from re-running unnecessarily
    const fetchFilteredMovies = useCallback(async (pageToFetch) => {
        if (pageToFetch === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        const apiUrl = theaterId 
            ? `/api/show/all?theaterId=${theaterId}&page=${pageToFetch}` 
            : `/api/show/all?page=${pageToFetch}`;

        try {
            const { data } = await axios.get(apiUrl); 
            if (data.success) {
                // If it's page 1, replace movies. Otherwise, add to the list.
                setMovies(prev => pageToFetch === 1 ? data.shows : [...prev, ...data.shows]);
                setTheater(data.theater || null);
                setCurrentPage(data.page);
                setTotalPages(data.totalPages);
            } else {
                toast.error(data.message || "Could not load movies.");
            }
        } catch (error) {
            console.error("Error fetching movies:", error);
            toast.error(error.response?.data?.message || "An error occurred.");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [theaterId, axios]); // Re-create this function if theaterId changes

    // Initial fetch for page 1
    useEffect(() => {
        fetchFilteredMovies(1);
    }, [fetchFilteredMovies]); // Run when the function is (re)created

    // Handler for the "Load More" button
    const handleLoadMore = () => {
        if (currentPage < totalPages && !isLoadingMore) {
            fetchFilteredMovies(currentPage + 1);
        }
    };

    if (isLoading) {
        return <Loading />;
    }

    const hasMorePages = currentPage < totalPages;

    return (
        <div className='relative my-32 md:my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[60vh]'>
            <BlurCircle top="150px" left="0px"/>
            <BlurCircle top="50px" right="50px"/>

            {theater ? (
                <div className="mb-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg max-w-2xl">
                    <h1 className='text-lg font-medium text-gray-400'>Now Playing at:</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <MapPinIcon className="w-5 h-5 text-primary" />
                        <h2 className="text-2xl font-semibold text-white">
                            {theater.location?.address?.city}, {theater.location?.address?.state}
                        </h2>
                    </div>
                </div>
            ) : (
                <h1 className='text-2xl font-semibold my-4 text-white'>Now Showing</h1>
            )}

            {movies.length > 0 ? (
                <>
                    <div className='flex flex-wrap max-sm:justify-center gap-6 md:gap-8'>
                        {movies.map((movie) => (
                            <MovieCard movie={movie} key={movie._id} theaterId={theaterId} />
                        ))}
                    </div>

                    {/* --- Load More Button --- */}
                    <div className="flex justify-center mt-16">
                        {hasMorePages && (
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dull text-white font-medium rounded-md transition duration-300 active:scale-95 shadow-lg hover:shadow-primary/40 disabled:opacity-50"
                            >
                                <ChevronDown className="w-4 h-4"/> 
                                {isLoadingMore ? 'Loading...' : 'Load More Movies'}
                            </button>
                        )}
                        {!hasMorePages && (
                            <p className="text-gray-500">You've reached the end!</p>
                        )}
                    </div>
                </>
            ) : (
                <div className='flex flex-col items-center justify-center min-h-[30vh] text-center'>
                    <h1 className='text-2xl font-bold text-white'>No Movies Found</h1>
                    <p className="text-gray-400 mt-2">
                        {theaterId 
                            ? "There are no active showtimes for this theater."
                            : "No movies are currently available."
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

export default Movies;