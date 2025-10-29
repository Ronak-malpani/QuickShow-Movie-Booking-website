// File: src/context/AppContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react"; 
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
// Note: Removed the unused import 'MovieCard' for clean code

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [shows, setShows] = useState([]); 
    const [favoriteMovies, setFavoriteMovies] = useState([]);

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;
    
    const { user } = useUser();
    const { getToken, signOut } = useAuth(); 
    const location = useLocation();
    const navigate = useNavigate();

    const fetchIsAdmin = async () => {
        try {
            const { data } = await axios.get('/api/admin/is-admin', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setIsAdmin(data.isAdmin);

            if (!data.isAdmin && location.pathname.startsWith('/admin')) {
                navigate('/');
                toast.error('You are not authorized to fetch admin dashboard');
            }
        } catch (error) {
            console.error("Error in fetchIsAdmin:", error);
        }
    };
    
    const fetchShows = async () => { 
        try {
            const { data } = await axios.get('/api/show/all'); 
            if (data.success) {
                setShows(data.shows);
            } else {
                toast.error(data.message);
            }
        }
        catch (error) {
            console.error(error);
        }
    };
    
    const fetchFavoriteMovies = async () => { 
        try {
            const { data } = await axios.get('/api/user/favorites',{headers:
                {Authorization: `Bearer ${await getToken() }`}})
                if(data.success){
                    setFavoriteMovies(data.movies)
                }
                else{
                    toast.error(data.message)
                }
        }catch(error){
            console.error(error)
        }
    };

    useEffect(() => { fetchShows(); }, []);

    useEffect(() => {
        if (user) {
            fetchIsAdmin();
            fetchFavoriteMovies();
        } else {
            setIsAdmin(false);
            setFavoriteMovies([]);
        }
    }, [user, getToken]);

    // --- LOGOUT HANDLER ---
    const handleLogout = async () => {
        await signOut();
        navigate('/');
        setIsAdmin(false);
        setFavoriteMovies([]);
        toast.success("Signed out successfully.");
    };
    // --- END NEW HANDLER ---


    const value = {
        axios,
        fetchIsAdmin,
        user, getToken, navigate, isAdmin,
        shows,
        favoriteMovies, fetchFavoriteMovies, image_base_url,
        handleLogout,
    };
    
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);