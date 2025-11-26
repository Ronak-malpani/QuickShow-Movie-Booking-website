import Stripe from "stripe";
import Booking from "../models/Booking.js"; 
import Show from "../models/Show.js"; 
import { inngest } from "../inngest/index.js"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

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
      const bookingId = session.metadata.bookingId;

      try {
        // Find booking and populate user + movie details
        const booking = await Booking.findById(bookingId)
          .populate({
            path: "show",
            populate: { path: "movie" }
          })
          .populate("user");

        if (!booking) {
          console.error("Booking not found in DB for this ID:", bookingId);
          break;
        }

        // Update booking as paid
        booking.isPaid = true;
        await booking.save();

        // Log payment confirmation in backend console
        console.log("   Payment confirmed for booking:", booking._id.toString());
        console.log(`   User: ${booking.user.name} (${booking.user.email})`);
        console.log(`   Movie: ${booking.show.movie.title}`);
        console.log(`   Seats: ${booking.bookedSeats.join(", ")}`);
        console.log(`   Amount: $${booking.amount}`);
        console.log(`   Payment link: ${booking.paymentLink}`);

        // Trigger Inngest function to send email
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId: booking._id.toString() }
        });
        console.log(`📧 Booking confirmation email triggered for ${booking.user.email}`);

      } catch (err) {
        console.error("Error updating booking or sending email:", err.message);
      }
      break;

    default:
      // Optional: log unhandled events
      //console.log("Unhandled event type:", event.type);
      break;
  }

  res.status(200).json({ received: true });
};
