// File: src/components/DateSelect.jsx

import React, { useState } from 'react';
import BlurCircle from './BlurCircle';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- Helper Functions ---
const getShortMonth = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return "Err";
  const monthIndex = parseInt(parts[1], 10) - 1;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex] || "Err";
};
const getDay = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return "00";
  return parts[2] || "00";
};
// --- END ---

const DateSelect = ({ dateTime, id, theaterId }) => { // 1. Receive theaterId
    const navigate = useNavigate();
    const [selected, setSelected] = useState(Object.keys(dateTime)[0]);

    const onBookHandler = () => {
        if (!selected) {
            return toast('Please select a date');
        }
        
        // 2. Build the new URL, preserving the theaterId
        const url = `/movies/${id}/${selected}`;
        const search = theaterId ? `?theaterId=${theaterId}` : '';
        navigate(url + search); // e.g., /movies/123/2025-10-27?theaterId=abc
        
        scrollTo(0, 0);
    };

    return (
        <div id='dateSelect' className='pt-16 md:pt-30'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-10
            relative p-8 bg-primary/10 border border-primary/20 rounded-lg'>
                <BlurCircle top="-100px" left="-100px" />
                <BlurCircle top="100px" right="0px" />
                <div>
                    <p className='text-lg font-semibold'>Choose Date</p>
                    <div className='flex items-center gap-6 text-sm mt-5'>
                        <ChevronLeftIcon width={28} className="cursor-pointer" />
                        <span className='grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4'>
                            
                            {Object.keys(dateTime).map((dateStr) => {
                                const { day, month } = { day: getDay(dateStr), month: getShortMonth(dateStr) };
                                return (
                                    <button 
                                        onClick={() => setSelected(dateStr)} 
                                        key={dateStr} 
                                        className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer ${selected === dateStr ? "bg-primary text-white" : "border border-primary/70"}`}
                                    >
                                        <span>{day}</span>
                                        <span>{month}</span>
                                    </button>
                                )
                            })}

                        </span>
                        <ChevronRightIcon width={28} className="cursor-pointer" />
                    </div>
                </div>
                <button onClick={onBookHandler} className='bg-primary 
                text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer'>Book Now</button>
            </div>
        </div>
    );
}
export default DateSelect;