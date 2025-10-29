// File: pages/admin/AddShows.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { useAppContext } from "../../context/AppContext";
import { CheckIcon, DeleteIcon, StarIcon, CheckSquare, Square } from 'lucide-react';
import { kConverter } from "../../lib/kConverter";

const AddShows = () => {
    const { axios, getToken, user, image_base_url } = useAppContext();
    const currency = import.meta.env.VITE_CURRENCY;

    // State variables
    const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [selectedMovies, setSelectedMovies] = useState([]);
    const [selectedTheaters, setSelectedTheaters] = useState([]); // This will hold _id strings
    const [dateTimeSelection, setDateTimeSelection] = useState({});
    const [dateTimeInput, setDateTimeInput] = useState("");
    const [showPrice, setShowPrice] = useState("");
    const [addingShow, setAddingShow] = useState(false);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingTheaters, setLoadingTheaters] = useState(true);

    // Fetch movies and theaters
    const fetchData = async () => {
        setLoadingMovies(true);
        setLoadingTheaters(true);
        try {
            const [moviesRes, theatersRes] = await Promise.all([
                axios.get('/api/show/now-playing', { headers: { Authorization: `Bearer ${await getToken()}` } }),
                axios.get('/api/theaters')
            ]);

            if (moviesRes.data.success) {
                setNowPlayingMovies(moviesRes.data.movies || []);
            } else {
                toast.error("Failed to load movies.");
            }

            if (theatersRes.data.success) {
                setTheaters((theatersRes.data.data || []).sort((a, b) => a.theaterId - b.theaterId));
            } else {
                toast.error("Failed to load theaters.");
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
            toast.error("Could not load initial data.");
        } finally {
            setLoadingMovies(false);
            setLoadingTheaters(false);
        }
    };

    // Movie selection handler
    const handleMovieSelect = (movieId) => {
        setSelectedMovies((prev) => prev.includes(movieId) ? prev.filter(id => id !== movieId) : [...prev, movieId]);
    };

    // --- Theater Selection Handlers (Using theater._id) ---
    const handleTheaterSelect = (theater_id) => { // The variable is the database _id
        setSelectedTheaters((prev) => prev.includes(theater_id) ? prev.filter(id => id !== theater_id) : [...prev, theater_id]);
    };

    const handleSelectAllTheaters = (event) => {
        if (event.target.checked) {
            setSelectedTheaters(theaters.map(t => t._id)); // Use ._id
        } else {
            setSelectedTheaters([]);
        }
    };

    // DateTime handlers
    const handleDateTimeAdd = () => {
         if (!dateTimeInput) return;
         const [date, time] = dateTimeInput.split("T");
         if (!date || !time ) return;
         setDateTimeSelection((prev)=>{
             const times = prev[date] || [] ;
             if(!times.includes(time)){
                const newTimes = [...times, time].sort();
                return { ...prev, [date]: newTimes };
             }
             return prev;
         });
        setDateTimeInput("");
    };
    const handleRemoveTime = (date, time) => {
         setDateTimeSelection((prev) => {
             const filteredTimes = (prev[date] || []).filter((t) => t !== time);
             if (filteredTimes.length === 0) {
                 const { [date]: _, ...rest } = prev;
                 return rest;
             }
             return { ...prev, [date]: filteredTimes };
         });
    };

    // Submit Handler
    const handleSubmit = async () => {
        if (selectedMovies.length === 0 || selectedTheaters.length === 0 || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
            return toast.error('Please select movie(s), theater(s), add date/time(s), and set a price.');
        }
        setAddingShow(true);
        try {
            const showsInput = Object.entries(dateTimeSelection).map(([date, time]) => ({ date, time }));

            // This payload now correctly sends the array of _id strings
            const payload = {
                movieIds: selectedMovies,
                theaterIds: selectedTheaters, // This is an array of _id strings
                showsInput: showsInput,
                showPrice: Number(showPrice)
            };

            const { data } = await axios.post('/api/show/add-bulk-cross', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                toast.success(data.message || "Shows added successfully!");
                setSelectedMovies([]);
                setSelectedTheaters([]);
                setDateTimeSelection({});
                setShowPrice("");
                setDateTimeInput("");
            } else {
                toast.error(data.message || "Failed to add shows.");
            }
        } catch (error) {
            console.error("Submission error: ", error);
            const errorMsg = error.response?.data?.message || 'An error occurred. Please try again.';
            toast.error(errorMsg);
        } finally {
            setAddingShow(false);
        }
    };

    // Fetch initial data on mount
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Loading state
    if (loadingMovies || loadingTheaters) {
        return <Loading />;
    }

    const allTheatersSelected = theaters.length > 0 && selectedTheaters.length === theaters.length;

    return (
        <div className="pb-10">
            <Title text1="Add" text2="Shows" />

            {/* --- Movie Selection Grid --- */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2 text-gray-200">1. Select Movie(s)</h2>
                <p className="text-sm text-gray-400 mb-4">Choose one or more movies from the list.</p>
                <div className="overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="grid grid-flow-col auto-cols-max gap-4 mt-1">
                        {nowPlayingMovies.map((movie) => {
                            const isSelected = selectedMovies.includes(movie.id);
                            return (
                                <div
                                    key={movie.id}
                                    className={`relative w-40 cursor-pointer border-2 ${isSelected ? 'border-primary shadow-lg scale-105' : 'border-transparent'} rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 bg-gray-800`}
                                    onClick={() => handleMovieSelect(movie.id)}
                                >
                                    <div className="relative">
                                        <img src={image_base_url + movie.poster_path} alt={movie.title} className="w-full h-56 object-cover brightness-90" />
                                        <div className="text-xs flex items-center justify-between p-1 bg-black/60 w-full absolute bottom-0 left-0">
                                            <p className="flex items-center gap-1 text-gray-300"><StarIcon className="w-3 h-3 text-primary fill-primary" />{movie.vote_average?.toFixed(1) || 'N/A'}</p>
                                            <p className="text-gray-400">{kConverter(movie.vote_count)} Votes</p>
                                        </div>
                                        <div className="absolute top-1.5 right-1.5">
                                            {isSelected ? (<CheckSquare className="w-5 h-5 text-primary bg-white rounded-sm" />) : (<Square className="w-5 h-5 text-gray-400 bg-white/70 rounded-sm opacity-60 group-hover:opacity-100" />)}
                                        </div>
                                    </div>
                                    <p className="font-medium truncate text-sm px-2 pt-1.5">{movie.title}</p>
                                    <p className="text-gray-400 text-xs px-2 pb-1.5">{movie.release_date}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- Theater Selection Checkboxes --- */}
            <section className="mb-8 max-w-lg">
                <h2 className="text-xl font-semibold mb-2 text-gray-200">2. Select Theater(s)</h2>
                <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 max-h-60 overflow-y-auto">
                    <div className="flex items-center mb-3 pb-3 border-b border-gray-600">
                        <input
                            type="checkbox"
                            id="select-all-theaters"
                            checked={allTheatersSelected}
                            onChange={handleSelectAllTheaters}
                            className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2 mr-2"
                        />
                        <label htmlFor="select-all-theaters" className="text-sm font-medium text-gray-300 cursor-pointer">
                            Select All Theaters ({theaters.length})
                        </label>
                    </div>
                    <div className="space-y-2">
                        {theaters.map((theater) => {
                            const isSelected = selectedTheaters.includes(theater._id);
                            return (
                                // *** THIS IS THE FIX ***
                                <div key={theater._id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`theater-${theater._id}`}
                                        value={theater._id} // The value is the ObjectId string
                                        checked={isSelected}
                                        // Make sure this passes theater._id, NOT theater.theaterId
                                        onChange={() => handleTheaterSelect(theater._id)} 
                                        className="w-4 h-4 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary focus:ring-2 mr-2"
                                    />
                                    <label htmlFor={`theater-${theater._id}`} className="text-sm text-gray-400 cursor-pointer hover:text-gray-200">
                                        {/* Display the human-readable ID, but use the database _id */}
                                        ID: {theater.theaterId} - {theater.location?.address?.city}, {theater.location?.address?.state}
                                    </label>
                                </div>
                                // *** END OF FIX ***
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- Price & DateTime Selection --- */}
            <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                    <label className="block text-sm font-medium mb-2">3. Show Price</label>
                    <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md bg-gray-900">
                        <span className="text-gray-400 text-sm">{currency}</span>
                        <input
                            min={0} type="number" value={showPrice}
                            onChange={(e) => setShowPrice(e.target.value)}
                            placeholder="Enter Price"
                            className="outline-none bg-transparent w-24 text-white"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">4. Add Date & Time(s)</label>
                    <div className="inline-flex gap-3 border border-gray-600 p-1 pl-3 rounded-lg bg-gray-900 items-center">
                        <input
                            type="datetime-local" value={dateTimeInput}
                            onChange={(e) => setDateTimeInput(e.target.value)}
                            className="outline-none rounded-md bg-gray-700 p-2 text-gray-300"
                        />
                        <button
                            onClick={handleDateTimeAdd}
                            className="bg-primary/80 text-white px-4 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer active:scale-95"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </section>

            {/* --- Display Selected Times --- */}
            {Object.keys(dateTimeSelection).length > 0 && (
                <section className="mb-8 max-w-md">
                    <h2 className="text-lg font-semibold mb-2 text-gray-200">Selected Showtimes:</h2>
                    <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                        <ul className="space-y-3">
                            {Object.entries(dateTimeSelection).map(([date, times]) => (
                                <li key={date}>
                                    <div className="font-medium text-gray-300">{date}</div>
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs">
                                        {times.map((time) => (
                                            <div key={time} className="border border-primary/50 bg-primary/10 px-2.5 py-1 flex items-center rounded text-gray-300">
                                                <span>{time}</span>
                                                <DeleteIcon
                                                    onClick={() => handleRemoveTime(date, time)}
                                                    width={14}
                                                    className="ml-2.5 text-red-500 hover:text-red-700 cursor-pointer"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            {/* --- Submit Button --- */}
            <button
                onClick={handleSubmit}
                disabled={addingShow || selectedMovies.length === 0 || selectedTheaters.length === 0 || Object.keys(dateTimeSelection).length === 0 || !showPrice}
                className={`bg-primary text-white px-8 py-2.5 mt-4 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium`}
            >
                {addingShow ? 'Adding Shows...' : `Add Show(s) to ${selectedMovies.length} Movie(s) at ${selectedTheaters.length} Theater(s)`}
            </button>
        </div>
    );
}

export default AddShows;