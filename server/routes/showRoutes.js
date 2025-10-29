// File: routes/showRouter.js

import express from "express";
// --- 1. Import the new function ---
import { 
    addShow, 
    addShowsBulk, 
    getNowPlayingMovies, 
    getShow, 
    getShows,
    addShowsCrossTheaters 
} from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get('/now-playing', protectAdmin, getNowPlayingMovies);
showRouter.post('/add', protectAdmin, addShow);
showRouter.post('/add-bulk', protectAdmin, addShowsBulk); 

showRouter.post('/add-bulk-cross', protectAdmin, addShowsCrossTheaters);


showRouter.get("/all", getShows);
showRouter.get("/:movieId", getShow);

export default showRouter;