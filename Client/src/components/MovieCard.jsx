import { StarIcon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import timeformat from '../lib/timeformat'
import { useAppContext } from '../context/AppContext'

const MovieCard = ({ movie }) => {
    const navigate = useNavigate()
    const { image_base_url } = useAppContext()

    // Safely gets the rating, expecting a structure like [7]
    let rating = 'N/A';
    if (Array.isArray(movie.vote_average) && movie.vote_average.length > 0) {
        rating = movie.vote_average[0].toFixed(1);
    }

    return (
        <div className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl hover:-translate-y-1 transition duration-300 w-66'>
            <img onClick={() => {
                navigate(`/movies/${movie._id}`)
                scrollTo(0, 0)
            }}
                src={image_base_url + movie.backdrop_path} alt=""
                className='rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer' />

            <p className='font-semibold mt-2 truncate'>{movie.title}</p>

            <p className='text-sm text-gray-400 mt-2'>
                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'} •
                {movie.genres.slice(0, 2).map(genre => genre.name).join(' | ')} •
                {/* This line now shows 0h 0m if the run_time array is empty */}
                {timeformat((Array.isArray(movie.run_time) && movie.run_time[0]) || 0)}
            </p>

            <div className='flex items-center justify-between mt-4 pb-3'>
                <button
                    onClick={() => {
                        navigate(`/movies/${movie._id}`)
                        scrollTo(0, 0)
                    }}
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

export default MovieCard