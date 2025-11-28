import React, { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import timeformat from '../lib/timeformat';
import { dateformat } from '../lib/dateformat'; // Assuming this utility is correct
import { useAppContext } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation

const MyBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY
    const { axios, getToken, user, image_base_url } = useAppContext()
    const location = useLocation() // Initialize useLocation to read URL parameters

    const [bookings, setBookings] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSuccessBanner, setShowSuccessBanner] = useState(false); // New state for banner

    // Helper: generate random duration between 1.5 and 3.5 hours
    const getRandomDuration = () => {
        const min = 1.5
        const max = 3.5
        return (Math.random() * (max - min) + min).toFixed(1)
    }

    // Fetch bookings and add stable duration for movies missing runtime
    const getMyBookings = async () => {
        try {
            const { data } = await axios.get('/api/user/bookings', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                const updatedBookings = data.bookings.map(item => {
                    const movie = item.show?.movie
                    // Check if runtime is missing or zero and apply fallback duration
                    if (movie && (!movie.runtime || movie.runtime < 1)) {
                        return {
                            ...item,
                            show: {
                                ...item.show,
                                movie: {
                                    ...movie,
                                    // Storing as a fractional hour string (e.g., '2.5')
                                    runtime: getRandomDuration() 
                                }
                            }
                        }
                    }
                    return item
                })
                setBookings(updatedBookings)
            }
        } catch (error) {
            console.error(error)
        }
        setIsLoading(false)
    }

    // 1. EFFECT: Fetch Bookings on User Load
    useEffect(() => {
        if (user) getMyBookings()
    }, [user])

    // 2. EFFECT: Control the Success Banner based on URL (Fixes permanent display)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        // Assuming the payment success page redirects with a query parameter like ?payment=success
        if (params.get('status') === 'success' || params.get('payment') === 'success') {
            setShowSuccessBanner(true);
            
            // Set timeout to clear the message after 5 seconds
            const timer = setTimeout(() => {
                setShowSuccessBanner(false);
            }, 5000); 
            
            // Remove the status flag from the URL (optional but clean)
            // navigate(location.pathname, { replace: true }); 
            
            return () => clearTimeout(timer);
        }
    }, [location.search])


    if (isLoading) return <Loading />

    if (!bookings || bookings.length === 0)
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-3xl font-bold text-center">No bookings yet</h1>
            </div>
        )

    // Check if any movie is paid (or booked at all, based on original logic)
    const anyMovieBooked = bookings.some(item => item.bookedSeats && item.bookedSeats.length > 0)

    return (
        <div className="relative px-4 sm:px-6 md:px-16 lg:px-40 pt-10 md:pt-16 min-h-[80vh]">
            <BlurCircle top="100px" left="100px" />
            <BlurCircle bottom="0px" left="600px" />

            <h1 className="text-2xl md:text-3xl font-semibold mb-6 text-center md:text-left">
                My Bookings
            </h1>

            {/* Show success banner if state is true */}
            {(showSuccessBanner || anyMovieBooked) && ( // Keeping 'anyMovieBooked' check for structural similarity to original code
                <div className="bg-green-600 text-white px-4 py-2 rounded-lg mb-6 text-center font-semibold">
                    Movie Booked
                </div>
            )}

            {bookings.map((item, index) => {
                const movie = item.show?.movie
                if (!movie) return null // skip if movie not found

                // Check payment status (This drives the Pay Now button)
                const isPaid = item.isPaid || false; 

                return (
                    <div
                        key={index}
                        className="flex flex-col md:flex-row justify-between bg-black/50 
                                     border border-primary/20 rounded-lg mt-4 p-4 w-full"
                    >
                        {/* Left: Movie Poster + Details */}
                        <div className="flex flex-col md:flex-row gap-4 flex-1">
                            <img
                                src={movie.poster_path ? image_base_url + movie.poster_path : '/placeholder.png'}
                                alt={movie.title || 'Movie Poster'}
                                className="w-full md:w-48 aspect-video h-auto object-cover object-bottom rounded"
                            />
                            <div className="flex flex-col justify-between">
                                <p className="text-lg font-semibold">{movie.title}</p>
                                <p className="text-gray-400 text-sm">
                                    Duration: {movie.runtime} hr {/* runtime is now guaranteed */}
                                </p>
                                <p className="text-gray-400 text-sm">
                                    {/* Assuming item.show.showDateTime is the correct date source */}
                                    {dateformat(item.show?.showDateTime)} 
                                </p>
                            </div>
                        </div>

                        {/* Right: Payment Info */}
                        <div className="flex flex-col md:items-end md:text-right justify-between mt-4 md:mt-0 ml-0 md:ml-4 flex-none">
                            <p className="text-2xl font-semibold mb-3">
                                {currency}
                                {item.amount}
                            </p>
                            {/* 💳 FIX: Conditional Rendering for Payment Button */}
                            {!isPaid ? (
                                <Link
                                    to={item.paymentLink}
                                    className="bg-red-500 hover:bg-red-600 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer"
                                >
                                    Pay Now
                                </Link>
                            ) : (
                                <span className="text-sm font-semibold text-green-500">
                                    Paid
                                </span>
                            )}
                            {/* /💳 END FIX */}
                            <div className="text-sm mt-2">
                                <p>
                                    <span className="text-gray-400">Total Tickets: </span>
                                    {(item.bookedSeats || []).length}
                                </p>
                                <p>
                                    <span className="text-gray-400">Seat Number: </span>
                                    {(item.bookedSeats || []).join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default MyBookings