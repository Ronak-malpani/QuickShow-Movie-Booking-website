// File: server/controllers/theaterController.js

import Theater from '../models/Theater.js';
import mongoose from 'mongoose';

export const getAllTheaters = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Get the start of today

        // This aggregation pipeline now verifies that movies exist
        const theatersWithCounts = await Theater.aggregate([
            // Stage 1: Get all theaters
            { $match: {} },
            
            // Stage 2: Lookup all shows for this theater
            {
                $lookup: {
                    from: 'shows',
                    localField: '_id',
                    foreignField: 'theater',
                    as: 'allShows'
                }
            },
            // Stage 3: Unwind shows, keeping theaters with 0 shows
            {
                $unwind: {
                    path: '$allShows',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Stage 4: Filter for active/upcoming shows
            {
                $match: {
                    $or: [
                        { 'allShows': { $eq: null } },
                        { 'allShows.showDateTime': { $gte: today } }
                    ]
                }
            },
            // Stage 5: Group back by theater, collecting unique movie IDs
            {
                $group: {
                    _id: '$_id',
                    // Bring back all original theater fields
                    location: { $first: '$location' },
                    theaterId: { $first: '$theaterId' },
                    screenCount: { $first: '$screenCount' },
                    imageUrl: { $first: '$imageUrl' },
                    // Add any other fields from your Theater model here
                    
                    // Add unique, non-null movie IDs to a set
                    uniqueMovieIds: { $addToSet: '$allShows.movie' } 
                }
            },
            
            // --- NEW FIX ---
            // Stage 6: Lookup the 'movies' collection to see which IDs are valid
            {
                $lookup: {
                    from: 'movies', // Your 'movies' collection name
                    localField: 'uniqueMovieIds', // The array of IDs from the $group stage
                    foreignField: '_id', // The _id in the 'movies' collection
                    as: 'foundMovies' // New array of *actual* movie documents
                }
            },
            // Stage 7: Calculate the movieCount from the size of the *found* movies
            {
                $addFields: {
                    movieCount: { $size: '$foundMovies' }
                }
            },
            // --- END FIX ---

            // Stage 8: Final cleanup
            {
                $project: {
                    allShows: 0, // Not needed anymore
                    uniqueMovieIds: 0,
                    foundMovies: 0 // Remove temporary array
                }
            },
            // Stage 9: Sort
            {
                $sort: { "theaterId": 1 }
            }
        ]);
        
        // Add default 'screenCount' if it doesn't exist
        const finalData = theatersWithCounts.map(theater => ({
            ...theater,
            screenCount: theater.screenCount ?? '?'
        }));

        res.json({ success: true, data: finalData });

    } catch (err) {
        console.error("Error fetching theaters with counts:", err);
        res.status(500).json({ success: false, message: "Server error fetching theaters." });
    }
};