// File: src/components/MovieCard.jsx

import { StarIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeformat from '../lib/timeformat';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({ movie, theaterId }) => { // 1. Receive theaterId
    const navigate = useNavigate();
    const { image_base_url } = useAppContext();

    // 2. Build the correct URL with theaterId
    const movieUrl = theaterId 
        ? `/movies/${movie.id || movie._id}?theaterId=${theaterId}`
        : `/movies/${movie.id || movie._id}`;

    // Safely gets the rating
    let rating = 'N/A';
    if (typeof movie.vote_average === 'number') {
        rating = movie.vote_average.toFixed(1);
    } else if (Array.isArray(movie.vote_average) && movie.vote_average.length > 0) {
        const avg = movie.vote_average[0];
        if (typeof avg === 'number') {
            rating = avg.toFixed(1);
        } else if (avg && typeof avg === 'object' && avg['$numberInt']) {
             rating = parseFloat(avg['$numberInt']).toFixed(1);
        }
    }

    const genres = Array.isArray(movie.genres) 
        ? movie.genres.slice(0, 2).map(genre => genre.name).join(' | ') 
        : 'N/A';
    
    let runtime = 0;
    if (typeof movie.runtime === 'number') {
        runtime = movie.runtime;
    } else if (Array.isArray(movie.run_time) && movie.run_time.length > 0) {
        runtime = movie.run_time[0]; // Handle old run_time array
    }

    const handleNavigate = () => {
        navigate(movieUrl); // 3. Use the new URL
        scrollTo(0, 0);
    };

    return (
        <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-60 sm:w-66'>
            <img 
                onClick={handleNavigate} // 4. Use the handler
                src={image_base_url + (movie.backdrop_path || movie.poster_path)}
                alt={movie.title}
                className='rounded-lg h-52 w-full object-cover object-center cursor-pointer'
                onError={(e) => { e.target.onerror = null; e.target.src = '/path/to/default/poster.png'; }}
            />

            <p className='font-semibold mt-2 truncate'>{movie.title}</p>

            <p className='text-sm text-gray-400 mt-2'>
                {movie.release_date ? new Date(movie.release_date.replace(/-/g, '/')).getFullYear() : 'N/A'} •
                {' '}{genres} •
                {' '}{timeformat(runtime || 0)}
            </p>

            <div className='flex items-center justify-between mt-4 pb-3'>
                <button
                    onClick={handleNavigate} // 5. Use the handler
                    className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
                >
                    Buy Tickets
                </button>
                <p className='flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1'>
                    <StarIcon className='w-4 h-4 text-primary fill-primary' />
                    {rating}
                </p>
            </div>
        </div>
    )
}

export default MovieCard;