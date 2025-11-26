import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Movie from "../models/Movie.js";
import sendEmail from "../configs/nodemailer.js";

// Create Inngest client
export const inngest = new Inngest({ id: "movie-ticket-booking" });

/* ------------------------------
   USER SYNC FUNCTIONS
--------------------------------*/

const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    await User.create({
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    });

    console.log("✅ User synced:", id);
  }
);

const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
    console.log("🗑️ User deleted:", id);
  }
);

const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    await User.findByIdAndUpdate(
      id,
      {
        _id: id,
        email: email_addresses[0].email_address,
        name: first_name + " " + last_name,
        image: image_url,
      },
      { new: true }
    );

    console.log("🔄 User updated:", id);
  }
);

/* ------------------------------------------
   RELEASE SEATS AFTER 10 MIN IF NOT PAID
-------------------------------------------*/

const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      if (!booking) return console.log("⚠️ Booking not found");

      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);

        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });

        show.markModified("occupiedSeats");
        await show.save();
        await Booking.findByIdAndDelete(booking._id);

        console.log("⛔ Booking deleted + seats released:", bookingId);
      }
    });
  }
);

/* ------------------------------------------
   BOOKING CONFIRMATION EMAIL (FINAL)
-------------------------------------------*/

const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "booking/payment.success" }, // Triggered after Stripe success
  async ({ event }) => {
    try {
      console.log("📩 Email function triggered...");

      const { bookingId } = event.data;

      const booking = await Booking.findById(bookingId)
        .populate({
          path: "show",
          populate: {
            path: "movie",
            model: "Movie",
          },
        })
        .populate("user");

      if (!booking) throw new Error("Booking not found");

      const movie = booking.show.movie;
      const user = booking.user;

      // Sending email
      await sendEmail({
        to: user.email,
        subject: `🎬 Booking Confirmed: ${movie.title}`,
        htmlBody: `
          <div style="font-family: Arial; line-height: 1.5;">
            <h2>Hi ${user.name},</h2>
            <p>Your booking for <strong>"${movie.title}"</strong> is confirmed.</p>

            <p>
              <strong>Date:</strong> ${new Date(booking.show.date).toLocaleDateString("en-IN")}<br/>
              <strong>Time:</strong> ${booking.show.time}
            </p>

            <p><strong>Seats:</strong> ${booking.bookedSeats.join(", ")}</p>
            <p><strong>Amount Paid:</strong> ₹${booking.amount}</p>

            <br/>
            <p>Enjoy the movie! 🍿</p>
            <p>— QuickShow Team</p>
          </div>
        `,
      });

      console.log(`✅ Booking email sent to ${user.email}`);
    } catch (error) {
      console.error("❌ Failed to send booking email:", error);
    }
  }
);

/* ------------------------------------------
   EXPORT ALL FUNCTIONS
-------------------------------------------*/

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
];
