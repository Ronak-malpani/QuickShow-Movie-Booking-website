// File: src/pages/Theaters.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { MapPinIcon, Video, ExternalLink, Film, ImageOff, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

// Constants for pagination options
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const Theaters = () => {
    // --- State Hooks ---
    const [allTheaters, setAllTheaters] = useState([]); // Holds ALL theaters fetched once
    const [isLoading, setIsLoading] = useState(true);   // Tracks initial loading state
    const [selectedState, setSelectedState] = useState(''); // Currently selected state filter
    const [selectedCity, setSelectedCity] = useState('');   // Currently selected city filter
    const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]); // How many items per "page"
    const [visibleCount, setVisibleCount] = useState(pageSize); // How many items are currently shown

    // --- Data Fetching Effect ---
    // Fetch ALL theaters ONCE when the component mounts
    useEffect(() => {
        const fetchAllTheatersOnce = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/theaters`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (data.success) {
                    setAllTheaters(data.data || []);
                } else {
                    toast.error(data.message || "Failed to fetch theaters.");
                    setAllTheaters([]);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("An error occurred while fetching theaters.");
                setAllTheaters([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllTheatersOnce();
    }, []);

    // Effect to reset visible count when filters or page size change
    useEffect(() => {
        setVisibleCount(pageSize);
    }, [pageSize, selectedState, selectedCity]);

    // --- Memoized Derived Data ---
    const states = useMemo(() => {
        const uniqueStates = [...new Set(allTheaters.map(t => t.location?.address?.state).filter(Boolean))];
        return uniqueStates.sort();
    }, [allTheaters]);

    const cities = useMemo(() => {
        if (!selectedState) return [];
        const uniqueCities = [...new Set(
            allTheaters
                .filter(t => t.location?.address?.state === selectedState && t.location?.address?.city)
                .map(t => t.location.address.city)
        )];
        return uniqueCities.sort();
    }, [allTheaters, selectedState]);

    const filteredTheaters = useMemo(() => {
        let result = allTheaters;
        if (selectedState) {
            result = result.filter(t => t.location?.address?.state === selectedState);
        }
        if (selectedCity) {
            result = result.filter(t => t.location?.address?.city === selectedCity);
        }
        return result;
    }, [selectedState, selectedCity, allTheaters]);

    const theatersToShow = useMemo(() => {
        return filteredTheaters.slice(0, visibleCount);
    }, [filteredTheaters, visibleCount]);

    const groupedTheatersToShow = useMemo(() => {
        return theatersToShow.reduce((acc, theater) => {
            const state = theater.location?.address?.state || 'Unknown State';
            if (!acc[state]) acc[state] = [];
            acc[state].push(theater);
            return acc;
        }, {});
    }, [theatersToShow]);

    // --- Helper Function ---
    const createMapLink = (coordinates) => {
        if (coordinates && coordinates.length === 2) {
            const lat = coordinates[1];
            const lng = coordinates[0];
            return `https://www.google.com/maps/@lat,lng,zoom8{lat},${lng}`;
        }
        return null;
    };

    // --- Pagination Handlers ---
    const handleShowMore = () => { setVisibleCount(prevCount => prevCount + pageSize); };
    const handlePageSizeChange = (newSize) => { setPageSize(newSize); };

    // --- Render Logic ---
    if (isLoading) return <Loading />;

    const hasMoreTheaters = filteredTheaters.length > visibleCount;

    // Helper Function to Render a Single Theater Card
    const renderTheaterCard = (theater) => {
        const coordinates = theater.location?.geo?.coordinates;
        const mapLink = createMapLink(coordinates);
        
        // Use path.basename to safely get filename
        const filename = theater.imageUrl ? theater.imageUrl.split('/').pop() : null;
        const imageUrl = filename ? `/Theater_Img/${filename}` : null;

        return (
            <div id={theater._id} key={theater._id} className='group bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-primary/30 hover:shadow-lg transition-all duration-300 border border-gray-700 hover:border-primary/40 flex flex-col'>
                {/* Image or Placeholder */}
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                        <img src={imageUrl} alt={`Exterior of ${theater.location?.address?.city || 'theater'}`} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'/>
                    ) : (
                        <div className="text-gray-500 text-center px-4">
                            <ImageOff className="w-10 h-10 mx-auto mb-2 text-gray-600"/>
                            <span className="text-xs font-medium">Image Not Available</span>
                        </div>
                    )}
                </div>
                {/* Card Content */}
                <div className="p-5 flex flex-col flex-grow space-y-3">
                   {/* City, State */}
                   <div className='flex items-center text-xl font-bold text-gray-100'>
                       <MapPinIcon className='w-5 h-5 mr-2.5 text-primary flex-shrink-0' />
                       <span>{theater.location?.address?.city || 'City'}, {theater.location?.address?.state || 'State'}</span>
                   </div>
                   {/* Street Address & Zip */}
                   <p className='text-gray-400 text-sm pl-[28px]'>
                       {theater.location?.address?.street1 || 'Address unavailable'}
                       {theater.location?.address?.zipcode ? `, ${theater.location.address.zipcode}` : ''}
                   </p>
                   {/* Map Link */}
                   {mapLink ? (
                       <a href={mapLink} target="_blank" rel="noopener noreferrer" className='inline-flex items-center text-xs text-blue-400 hover:text-blue-300 hover:underline transition duration-200 pl-[28px] w-fit'>
                           <ExternalLink className='w-3 h-3 mr-1.5' /> View on Map
                       </a>
                   ) : (
                       <p className='text-xs text-gray-600 pl-[28px]'>(Map location unavailable)</p>
                   )}
                   {/* Divider */}
                   <hr className="border-t border-gray-700 !my-4"/>
                   {/* Movies Playing & Screens */}
                   <div className="flex justify-between items-center text-sm text-gray-300 mt-auto pt-1">
                       <Link to={`/movies?theaterId=${theater._id}`} // <-- USE _id HERE
                           className='flex items-center hover:text-primary transition-colors group/link'
                           title="See movies playing here">
                           <Film className='w-4 h-4 mr-2 text-primary group-hover/link:animate-pulse' />
                           <span>{theater.movieCount ?? 0} {theater.movieCount === 1 ? 'Movie' : 'Movies'} Playing</span>
                       </Link>
                       <div className='flex items-center text-gray-400' title="Number of screens">
                           <Video className='w-4 h-4 mr-2 text-primary/70' />
                           <span>{theater.screenCount ?? '?'} Screens</span>
                       </div>
                   </div>
                   {/* Theater ID */}
                   <p className="text-xs text-gray-600 text-right pt-1">ID: {theater.theaterId}</p>
                </div>
            </div>
        );
    };

    return (
        <div className='min-h-screen bg-gray-900 text-white pt-28 pb-24 px-4 sm:px-6 lg:px-8'>
            <div className='max-w-6xl mx-auto'>
                <h1 className='text-4xl font-bold text-center mb-12 tracking-wider text-primary'>Our Theaters </h1>

                {/* --- Filter Dropdowns --- */}
                <div className='sticky top-[6.5rem] z-10 mb-8'>
                    <div className='flex flex-col sm:flex-row gap-4 bg-gray-800 p-5 rounded-lg border border-gray-700 shadow-lg'>
                        {/* State Filter */}
                        <div className='flex-1'>
                            <label htmlFor="state-filter" className="block text-sm font-medium text-gray-300 mb-1.5">Filter by State</label>
                            <select
                                id="state-filter"
                                value={selectedState}
                                onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
                            >
                                <option value="">All States</option>
                                {states.map(state => (<option key={state} value={state}>{state}</option>))}
                            </select>
                        </div>
                         {/* City Filter */}
                        <div className='flex-1'>
                            <label htmlFor="city-filter" className="block text-sm font-medium text-gray-300 mb-1.5">Filter by City</label>
                            <select
                                id="city-filter"
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                disabled={!selectedState}
                                className={`w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">All Cities</option>
                                {cities.map(city => (<option key={city} value={city}>{city}</option>))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- Page Size Selector --- */}
                <div className="flex justify-center items-center gap-3 mb-12 text-sm">
                    <span className="text-gray-400">Show:</span>
                    {PAGE_SIZE_OPTIONS.map(size => (
                        <button
                            key={size}
                            onClick={() => handlePageSizeChange(size)}
                            className={`px-4 py-1.5 rounded-md transition-colors ${
                                pageSize === size
                                ? 'bg-primary text-white font-semibold ring-2 ring-primary-light ring-offset-2 ring-offset-gray-900'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                     <span className="text-gray-400">per page</span>
                </div>

                {/* --- Theaters List Section --- */}
                {filteredTheaters.length === 0 ? (
                    <p className='text-center text-gray-500 mt-16 text-lg'>No theaters found matching your criteria.</p>
                ) : (
                    <div>
                        {selectedState ? (
                            // Render FLAT list if State is selected
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {theatersToShow.map(theater => renderTheaterCard(theater))}
                            </div>
                        ) : (
                            // Render GROUPED list if 'All States' is selected
                            Object.keys(groupedTheatersToShow).sort().map(state => (
                                <div key={state} className="mb-12">
                                    <h2 className="text-3xl font-semibold text-primary-light border-b border-gray-700 pb-3 mb-8 mt-4">
                                        {state}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {groupedTheatersToShow[state].map(theater => renderTheaterCard(theater))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- Show More Button --- */}
                {hasMoreTheaters && (
                    <div className="flex justify-center mt-16">
                        <button
                            onClick={handleShowMore}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dull text-white font-medium rounded-md transition duration-300 active:scale-95 shadow-lg hover:shadow-primary/40"
                        >
                            <ChevronDown className="w-4 h-4"/> Show More Theaters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Theaters;