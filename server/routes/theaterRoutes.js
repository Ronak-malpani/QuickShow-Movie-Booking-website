import express from 'express';
import { getAllTheaters } from '../controllers/theaterController.js';

const theaterRouter = express.Router();

// GET /api/theaters
theaterRouter.get('/', getAllTheaters);

export default theaterRouter;
