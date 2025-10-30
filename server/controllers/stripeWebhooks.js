import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";
import { sendEmail } from "../configs/nodemailer.js"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Stripe requires the *raw body* to verify signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(" Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { bookingId, movieName, showTime, selectedSeats, email } = session.metadata || {};
        const userEmail = email; 
        
        if (!bookingId) {
          console.warn("⚠️ Missing bookingId in metadata.");
          break;
        }

        //  Update booking status in DB
        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: "",
        });

        //  Send email confirmation
        if (userEmail) {
          const subject = "🎟️ QuickShow Booking Confirmed!";
          const html = `
            <h2>Your Booking is Confirmed!</h2>
            <p>Thank you for booking with <b>QuickShow</b>.</p>
            <p><strong>Movie:</strong> ${movieName || "N/A"}</p>
            <p><strong>Showtime:</strong> ${showTime || "N/A"}</p>
            <p><strong>Seats:</strong> ${selectedSeats || "N/A"}</p>
            <p>Enjoy your movie! 🍿</p>
          `;

          try {
            await sendEmail({ to: userEmail, subject, html });
            console.log(` Confirmation email sent to ${userEmail}`);
          } catch (emailErr) {
            console.error("❌ Failed to send confirmation email:", emailErr.message);
          }
        } else {
          console.warn(" No user email found in session metadata.");
        }

        //  Optional: Send Inngest event (for async workflows)
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId },
        });

        console.log(" Booking updated, email sent, and Inngest triggered for:", bookingId);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(" Webhook processing error:", err);
    res.status(500).send("Internal Server Error");
  }
};
