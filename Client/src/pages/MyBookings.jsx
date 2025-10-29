// File: src/pages/MyBookings.jsx

import React, { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import { Clock, Calendar, Ticket, DollarSign, MapPin } from 'lucide-react'; // Added icons
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

// Note: Ensure your local paths to timeformat and dateformat are correct
import timeformat from '../lib/timeformat'; 
import { dateformat } from '../lib/dateformat'; 

const MyBookings = () => {
    const currency = import.meta.env.VITE_CURRENCY;
    const { axios, getToken, user, image_base_url } = useAppContext();

    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getMyBookings = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get('/api/user/bookings', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                // Sort by date: newest (latest showDateTime) first
                const sortedBookings = data.bookings.sort((a, b) => 
                    new Date(b.show.showDateTime) - new Date(a.show.showDateTime)
                );
                setBookings(sortedBookings);
            }
        }
        catch (error) {
            console.error("Error fetching bookings:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) {
            getMyBookings();
        }
    }, [user]);

    if (isLoading) return <Loading />;

    return (
        <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
            <BlurCircle top="100px" left="100px" />
            <BlurCircle bottom="0px" left="600px" />
            
            <h1 className='text-3xl font-bold text-white mb-8'>My Bookings</h1>

            {bookings.length === 0 ? (
                <div className='mt-16 text-center text-gray-400'>
                    <p className='text-lg'>You haven't booked any shows yet.</p>
                </div>
            ) : (
                <div className='flex flex-col gap-6 max-w-4xl mx-auto'>
                    {bookings.map((item, index) => {
                        const showDateTime = new Date(item.show.showDateTime);
                        const movie = item.show.movie;
                        const totalTickets = (item.bookedSeats || []).length;
                        
                        return (
                            <div key={item._id || index} 
                                 className={`flex flex-col md:flex-row border rounded-xl overflow-hidden shadow-xl transition-all duration-300 
                                     ${item.isPaid 
                                         ? 'bg-gray-800 border-green-600/50 hover:border-green-400' 
                                         : 'bg-red-900/10 border-red-600/50 hover:border-red-400'
                                     }`}
                            >
                                {/* LEFT SECTION: Poster and Movie Info */}
                                <div className='flex p-4'>
                                    {/* Movie Poster */}
                                    <img 
                                        src={image_base_url + movie.poster_path} 
                                        alt={movie.title} 
                                        className='w-24 h-36 object-cover rounded-lg flex-shrink-0 mr-4' 
                                        onError={(e) => {e.target.onerror = null; e.target.src="/path/to/default/poster.png";}}
                                    />
                                    
                                    <div className='flex flex-col justify-center'>
                                        {/* Movie Title */}
                                        <p className='text-xl font-semibold text-white mb-1'>{movie.title}</p>
                                        
                                        {/* Runtime and Genre */}
                                        <p className='text-gray-400 text-sm'>
                                            {timeformat(movie.runtime || 0)} • {movie.genres?.slice(0, 1).map(g => g.name).join('')}
                                        </p>
                                        
                                        {/* Date and Time */}
                                        <p className='text-primary font-medium mt-2 flex items-center'>
                                            <Calendar className='w-4 h-4 mr-2'/> {dateformat(showDateTime)}
                                        </p>
                                        <p className='text-white text-sm flex items-center'>
                                            <Clock className='w-4 h-4 mr-2 text-primary'/> {showDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        {/* Theater Location (Requires backend fix to populate this) */}
                                        {item.show.theater?.location?.address?.city && (
                                            <p className='text-gray-500 text-xs mt-1 flex items-center'>
                                                <MapPin className='w-3 h-3 mr-1'/> {item.show.theater.location.address.city}, {item.show.theater.location.address.state}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* RIGHT SECTION: Details and Payment Status */}
                                <div className={`md:ml-auto p-4 flex flex-col justify-between items-start md:items-end ${!item.isPaid ? 'border-t md:border-t-0 md:border-l border-red-600/50' : ''}`}>
                                    
                                    {/* Seat/Ticket Info */}
                                    <div className='text-sm space-y-1 mb-4 md:mb-0'>
                                        <p><span className='text-gray-400'>Tickets: </span>{totalTickets}</p>
                                        <p className='break-all'><span className='text-gray-400'>Seats: </span>{(item.bookedSeats || []).join(", ")}</p>
                                    </div>

                                    {/* Price and Action */}
                                    <div className='mt-auto flex flex-col items-start md:items-end'>
                                        <p className='text-3xl font-bold mb-2 flex items-center'>
                                            <DollarSign className='w-5 h-5 text-green-400 mr-1'/> {currency}{item.amount.toFixed(2)}
                                        </p>

                                        {/* Status Tag */}
                                        <p className={`px-3 py-0.5 rounded-full text-xs font-semibold mb-3 ${item.isPaid ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'}`}>
                                            {item.isPaid ? 'CONFIRMED' : 'PENDING PAYMENT'}
                                        </p>

                                        {/* Pay Now Button (Only if unpaid) */}
                                        {!item.isPaid && item.paymentLink && (
                                            <Link to={item.paymentLink} className='bg-primary px-5 py-2 text-sm rounded-full 
                                                font-bold hover:bg-primary-dull transition-colors mt-2'>
                                                Pay Now
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyBookings;