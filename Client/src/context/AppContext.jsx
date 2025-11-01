// File: src/context/AppContext.jsx

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react"; 
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import API from "../api/axiosInstance"; // ✅ our configured axios
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
            const { data } = await API.get('/api/admin/is-admin', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setIsAdmin(data.isAdmin);

            if (!data.isAdmin && location.pathname.startsWith('/admin')) {
                navigate('/');
                toast.error('You are not authorized to access the admin dashboard');
            }
        } catch (error) {
            console.error("Error in fetchIsAdmin:", error);
        }
    };
    
    const fetchShows = async () => { 
        try {
            const { data } = await API.get('/api/show/all'); 
            if (data.success) {
                setShows(data.shows);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };
    
    const fetchFavoriteMovies = async () => { 
        try {
            const { data } = await API.get('/api/user/favorites', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setFavoriteMovies(data.movies);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
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

    const handleLogout = async () => {
        await signOut();
        navigate('/');
        setIsAdmin(false);
        setFavoriteMovies([]);
        toast.success("Signed out successfully.");
    };

    const value = {
        API,
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
};

export const useAppContext = () => useContext(AppContext);
