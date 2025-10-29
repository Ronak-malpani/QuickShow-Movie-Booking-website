// File: src/pages/SeatLayout.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import { ClockIcon ,ArrowRightIcon} from 'lucide-react';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const SeatLayout = () => {
  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]];
  
  const { id, date } = useParams();
  const [searchParams] = useSearchParams();
  const theaterId = searchParams.get('theaterId');

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const { axios, getToken, user } = useAppContext();
  const navigate = useNavigate();
  
  const getShow = async () => {
    try {
      const apiUrl = theaterId
          ? `/api/show/${id}?theaterId=${theaterId}`
          : `/api/show/${id}`;

      const { data } = await axios.get(apiUrl);
      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select time first");
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select 5 seats");
    }
    if (occupiedSeats.includes(seatId)) {
      return toast('This seat is already booked');
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat != seatId) : [...prev, seatId]);
  };

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button key={seatId} onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded border border-primary/60 cursor-pointer
              ${selectedSeats.includes(seatId) && "bg-primary text-white"}
              ${occupiedSeats.includes(seatId) && "opacity-50"}`}>
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  const getOccupiedSeats = async () => {
    if (!selectedTime || !selectedTime.showId) {
        setOccupiedSeats([]);
        return;
    }
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error(data.message);
        setOccupiedSeats([]);
      }
    } catch (error) {
      console.log("Error fetching occupied seats:", error);
      toast.error("Could not fetch seat availability.");
      setOccupiedSeats([]);
    }
  };

  const bookTickets = async () => {
    try {
      if (!user) return toast.error('Please login to proceed');
      if (!selectedTime || !selectedSeats.length) return toast.error('Please select a time and seats');
      
      const { data } = await axios.post('/api/booking/create', {
        showId: selectedTime.showId,
        selectedSeats
      }, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getShow();
  }, [id, date, theaterId]); // Added date and theaterId

  useEffect(() => {
    setSelectedSeats([]);
    setOccupiedSeats([]);
    if (selectedTime) {
      getOccupiedSeats();
    }
  }, [selectedTime]);

  if (!show) {
    return <Loading />;
  }

  const currentTimings = show.dateTime[date];
  const hasValidTimings = Array.isArray(currentTimings) && currentTimings.length > 0;

  return (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* Available Timings */}
      <div className='w-full md:w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30 mb-8 md:mb-0'>
        <p className='text-lg font-semibold px-6'>Available Timings</p>
        <div className='mt-5 space-y-1'>
          {hasValidTimings ? (
            currentTimings.map((item) => (
              <div
                key={item.showId || item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition
                  ${selectedTime?.showId === item.showId ? "bg-primary text-white " : "hover:bg-primary/20"}`}
              >
                <ClockIcon className="w-4 h-4" />
                <p className='text-sm'>{isoTimeFormat(item.time)}</p>
              </div>
            ))
          ) : (
            <div className='px-6 text-gray-400 text-sm'>
              <p>No timings found for this date.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Seats Layout */}
       <div className='relative flex-1 flex flex-col items-center md:pl-10'>
        <BlurCircle top="-100px" left="-100px"/>
        <BlurCircle top="0" right="0"/>
        <h1 className='text-2xl font-semibold mb-4'>Select your seat</h1>
        <img src={assets.screenImage} alt="screen" className="w-full max-w-lg"/>
        <p className='text-gray-400 text-sm mb-6'>SCREEN SIDE</p>

        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          <div className='grid grid-cols-1 md:grid-cols-1 gap-4 md:gap-2 mb-6'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>
          {/* --- THIS IS THE FIX --- */}
          <div className='grid grid-cols-2 gap-6 md:gap-11'>
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>
                {/* Ensure inner map is also complete */}
                {group.map(row => renderSeats(row))} 
              </div>
            ))}
          </div>
          {/* --- END OF FIX --- */}
        </div>

        <button
          onClick={bookTickets}
          disabled={!selectedTime || selectedSeats.length === 0}
          className={`flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95 ${(!selectedTime || selectedSeats.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Proceed to Checkout <ArrowRightIcon strokeWidth={3} className="w-4 h-4"/>
        </button> 
      </div>
    </div>
  );
}

export default SeatLayout;