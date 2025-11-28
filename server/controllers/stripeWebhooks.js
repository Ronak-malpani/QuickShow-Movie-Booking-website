import Stripe from "stripe";
import Booking from "../models/Booking.js"; 
import Show from "../models/Show.js"; 
import { inngest } from "../inngest/index.js"; 

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  // 1. Verify and construct the event from the raw body
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      
      // Get the booking ID saved in the session metadata (sent as a string)
      const bookingIdString = session.metadata.bookingId; 

      try {
        // CRITICAL FIX: Use findOne({_id: ...}) to reliably find the booking.
        const booking = await Booking.findOne({ _id: bookingIdString })
          .populate({
            path: "show",
            populate: { path: "movie" }
          })
          .populate("user");

        if (!booking) {
          console.error("Booking not found in DB for this ID:", bookingIdString);
          break;
        }

        // 2. Update booking as paid ONLY if it hasn't been already
        if (!booking.isPaid) {
            booking.isPaid = true;
            await booking.save();

            // Log payment confirmation
            console.log("Payment confirmed for booking:", booking._id.toString());
            console.log(`User: ${booking.user.name} (${booking.user.email})`);
            
            // 3. Trigger Inngest function to send email
            await inngest.send({
                // ✅ EVENT NAME FIX: Trigger the correct event name expected by the listener
                name: "app/show.booked", 
                data: { bookingId: booking._id.toString() }
            });
            console.log(`Booking confirmation email triggered for ${booking.user.email}`);

        } else {
             console.log("Booking already processed/paid:", booking._id.toString());
        }

      } catch (err) {
        console.error("Error finding or updating booking:", err.message);
      }
      break;

    default:
      console.log("Unhandled event type:", event.type);
      break;
  }

  // 4. Send success response to Stripe
  res.status(200).json({ received: true });
};