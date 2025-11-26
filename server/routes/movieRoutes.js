import express from "express";
import { fetchNowPlaying } from "../controllers/movieController.js";

const router = express.Router();

router.get("/now-playing", fetchNowPlaying);

export default router;
