import React,{ useEffect,useState } from 'react'
import { dummyBookingData } from '../../assets/assets'
import Title from '../../components/admin/Title'
import Loading from '../../components/Loading'
import { dateformat } from '../../lib/dateformat'
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast'; // Import toast for better feedback

const ListBookings= () => {
    
    const currency = import.meta.env.VITE_CURRENCY

    const {axios,getToken,user} = useAppContext()

    const [bookings, setBookings]= useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAllBookings = async () => {
        try{
            // Assuming this endpoint (api/admin/all-bookings) is defined to populate show and movie
            const { data } = await axios.get("/api/admin/all-bookings",{headers:{Authorization:`Bearer ${await getToken()}`}
            });
            if (data.success) {
                setBookings(data.bookings);
            } else {
                toast.error(data.message);
            }
        }
        catch(error){
            console.error(error);
            toast.error("Failed to fetch all bookings.");
        }
        setIsLoading(false)
    };

    useEffect(()=>{
        if(user){
            getAllBookings();
        }
    },[user]);

    return !isLoading ?(
        <>
            <Title text1="List" text2="Bookings" />
            <div className="max-w-4xl mt-6 overflow-x-auto">
                <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
                    <thead>
                        <tr className="bg-primary/20 text-left text-white">
                            <th className="p-2 font-medium pl-5">User Name</th>
                            <th className="p-2 font-medium">Movie Name</th>
                            <th className="p-2 font-medium">Show Time</th>
                            <th className="p-2 font-medium">Seats</th>
                            <th className="p-2 font-medium">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm font-light">
                        {bookings.map((item, index) => {
                            // Safely check if both show and user details exist before proceeding
                            if (!item.user || !item.show) return null; 

                            // CRITICAL FIX: Ensure movie details exist before accessing properties
                            const movieTitle = item.show.movie?.title || 'Movie Deleted';
                            const showTime = item.show.showDateTime;

                            return (
                                <tr key={index} className="border-b border-primary/20
                                    bg-primary/5 even:bg-primary/10">
                                    <td className="p-2 min-w-45 pl-5">{item.user.name}</td>
                                    
                                    {/* FIX: Use the safely extracted movie title */}
                                    <td className="p-2">{movieTitle}</td> 
                                    
                                    <td className="p-2">{dateformat(showTime)}</td>
                                    <td className="p-2">{(item.bookedSeats || []).join(", ")}</td>
                                    <td className="p-2">{currency}{item.amount}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    ) : <Loading />
}
export default ListBookings;