import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, StarIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dummyDashboardData } from '../../assets/assets'; // Assuming dummy data import
import Title from '../../components/admin/Title';
import BlurCircle from '../../components/BlurCircle';
import Loading from '../../components/Loading';
import { dateformat } from '../../lib/dateformat'; // Assuming dateformat utility
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast'; // Import toast for error display


const Dashboard = () => {

    const {axios,getToken,user,image_base_url} = useAppContext()

    const currency = import.meta.env.VITE_CURRENCY

    const [dashboardData,setDashboardData] = useState({
        totalBookings:0,
        totalRevenue: 0,
        activeShows:[],
        totalUser:0
    });

    const [loading, setLoading] = useState(true);

    const dashboardCards = [
        {title: "Total Bookings", value: dashboardData.totalBookings || "0",icon: ChartLineIcon},
        {title: "Total Revenue", value: currency + (dashboardData.totalRevenue || "0"),icon: CircleDollarSignIcon},
        {title: "Active Shows", value: dashboardData.activeShows.length || "0", icon: PlayCircleIcon},
        {title: "Total Users", value: dashboardData.totalUser || "0", icon: UsersIcon }
    ]

    const fetchDashboardData = async () => {
        try{
            // Fetch data from the backend admin dashboard endpoint
            const { data } =await axios.get("/api/admin/dashboard",{headers:{Authorization:`Bearer ${await getToken()}`}})
            if(data.success){
                setDashboardData(data.dashboardData)
                setLoading(false)
            }else{
                toast.error(data.message)
                setLoading(false);
            }
        }
        catch(error){
            console.error("Error fetching dashboard data:",error);
            toast.error("Error fetching dashboard data");
            setLoading(false);
        }
    };

    // Helper function to safely extract and format the vote average value
    const getSafeVoteAverage = (rawVote) => {
        let voteValue = 0;

        // Case 1: Raw number (most common TMDB output)
        if (typeof rawVote === 'number') {
            voteValue = rawVote;
        } 
        // Case 2: Array format (sometimes seen in specific API caches)
        else if (Array.isArray(rawVote) && rawVote.length > 0) {
            const firstItem = rawVote[0];
            // Access the nested structure if Mongoose stored it that way
            voteValue = firstItem?.$numberDouble ? parseFloat(firstItem.$numberDouble) : 0;
        } 
        // Case 3: Single Mongoose object format (e.g., { $numberDouble: '7.5' })
        else if (rawVote && typeof rawVote === 'object' && rawVote.$numberDouble) {
             voteValue = parseFloat(rawVote.$numberDouble);
        }

        // Return formatted string or '0.0'
        return voteValue > 0 ? voteValue.toFixed(1) : '0.0';
    };


    useEffect(()=>{
        if(user){
            fetchDashboardData();
        }
    },[user]);

    return !loading ? (
        <>
        <Title text1="Admin" text2="Dashboard" />

        <div className="relative flex flex-wrap gap-4 mt-6">
            <BlurCircle top="-100px" left="0" />
            <div className="flex flex-wrap gap-4 w-full">
                {dashboardCards.map((card, index)=> (
                    <div key={index} className="flex items-center justify-between px-4
                    py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full">
                    <div>
                        <h1 className="text-sm">{card.title}</h1>
                        <p className="text-xl font-medium mt-1">{card.value}</p>
                    </div>
                    <card.icon className="w-6 h-6" />
                </div>
                ))}
            </div>
        </div>

        <p className="mt-10 text-lg font-medium">Active Shows</p>
        <div className="relative flex flex-wrap gap-8 mt-4 max-w-5xl">
            <BlurCircle top="100px" left="-10%" />
            {dashboardData.activeShows.map((show) => (
                    // CRITICAL: Check if movie data is successfully populated
                    show.movie ? (
                    <div key={show._id} className="w-55 rounded-lg overflow-hidden 
                      h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300">
                        <img 
                            src={image_base_url + show.movie.poster_path} 
                            alt={show.movie.title || 'Movie Poster'} 
                            className="h-60 w-full object-cover" 
                        />
                        <p className="font-medium p-2 truncate">{show.movie.title}</p>
                        
                        <div className="flex items-center justify-between px-2">
                            <p className="text-lg font-medium">{currency}{show.showPrice}</p>
                            <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                                <StarIcon className="w-4 h-4 text-primary fill-primary" />
                                {/*  FIX APPLIED HERE: Safely extract and format vote average */}
                                {getSafeVoteAverage(show.movie.vote_average)}
                            </p>
                        </div> 
                        <p className="px-2 pt-2 text-sm text-gray-500">{dateformat(show.showDateTime)}</p>
                    </div> 
                    ) : null 
                )
            )}
        </div>

        </>
    ) : <Loading />
}
export default Dashboard