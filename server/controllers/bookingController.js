import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js"
import stripe from 'stripe'
import ShowModel from "../models/Show.js"; // Renamed for clarity in local scope

//Function to check availabilty of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats)=>{
    try{
        const showData= await ShowModel.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats || {};

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;

    }catch(error){
        console.log("Error in checkSeatsAvailability:",error.message);
        return false;
    }
}

export const createBooking = async(req,res) =>{

    try{
        const {userId} = req.auth();
        const {showId,selectedSeats} = req.body;
        const {origin} =req.headers;

        //Check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)

        if(!isAvailable){
            return res.json({success:false,message:"Selected Seats are not Available."})
        }

        //Get show details
        const showData = await ShowModel.findById(showId).populate('movie');

        // Create a new Booking (status: pending payment)
        const booking = await Booking.create({
            user:userId,
            show:showId,
            amount:showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
            isPaid: false // Ensure it starts as unpaid
        })

        // Reserve seats (temporarily set occupied before payment)
        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat]=booking._id; // Use booking ID for temporary reservation
        })

        showData.markModified('occupiedSeats');
        await showData.save();

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // Creating line items for Stripe
        const line_items = [{
            price_data: {
                currency:'usd',
                product_data:{
                    name: showData.movie.title,
                    description: `Seats: ${selectedSeats.join(', ')} | Date: ${new Date(showData.showDateTime).toLocaleDateString()}`
                },
                // CRITICAL FIX: Ensure unit_amount is the total amount (amount * 100)
                unit_amount: Math.round(booking.amount * 100) 
            },
            quantity: 1 
        }]
        
        // Ensure success_url includes the loading step before going to my-bookings
        const session = await stripeInstance.checkout.sessions.create({
            success_url:`${origin}/loading/my-bookings`, 
            cancel_url:`${origin}/my-bookings`,
            line_items: line_items,
            mode:'payment',
            metadata: {
                // Pass the booking ID so the webhook can identify the transaction
                bookingId: booking._id.toString() 
            },
            expires_at:Math.floor(Date.now()/1000)+30*60, // Expires in 30 minutes
        })
        
        // Save the payment link and session ID to the local booking document
        booking.paymentLink = session.url
        booking.stripeSessionId = session.id 
        await booking.save()

        // Run Inngest Scheduler Function to check payment status after 10 min
        await inngest.send({
            name:"app/checkpayment",
            data:{
                bookingId: booking._id.toString()
            }
        })

        res.json({success:true,url:session.url})

    }
    catch(error){
        console.log("Create Booking Error:", error.message);
        res.status(500).json({success:false,message: error.message})
    }
}

export const getOccupiedSeats = async (req,res)=>{
    try{
        const{showId} =req.params;
        const showData = await ShowModel.findById(showId)

        if (!showData) {
            return res.json({ success: true, occupiedSeats: [] });
        }

        const occupiedSeats = Object.keys(showData.occupiedSeats || {});

        res.json({success:true,occupiedSeats})
    }
    catch(error){
        console.log("Get Occupied Seats Error:", error.message);
        res.status(500).json({success:false,message: error.message});
    }
}