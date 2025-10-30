// File: server/inngest/index.js

import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { sendEmail } from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// --- (keep syncUserCreation, syncUserDeletion, syncUserUpdation) ---
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
     { event: 'clerk/user.created' },
     async ({ event }) => {
     const { id, first_name, last_name, email_addresses, image_url } = event.data
     const userData = {
     _id: id,
     email: email_addresses[0].email_address,
     name: first_name + ' ' + last_name,
     image: image_url
     }
     await User.create(userData)
     }
);

const syncUserDeletion = inngest.createFunction(
 { id: 'delete-user-from-clerk' },
 { event: 'clerk/user.deleted' },
 async ({ event }) => {
 const { id } = event.data
 await User.findByIdAndDelete(id)
}
);
const syncUserUpdation = inngest.createFunction(
 { id: 'update-user-from-clerk' },
 { event: 'clerk/user.updated' },
 async ({ event }) => {
 const { id, first_name, last_name, email_addresses, image_url } = event.data
 const userData = {
 _id: id,
 email: email_addresses[0].email_address,
 name: first_name + ' ' + last_name,
 image: image_url
 }
 await User.findByIdAndUpdate(id, userData)
 }
);
// --- END SYNC FUNCTIONS ---


// --- (keep releaseSeatsAndDeleteBooking) ---
const releaseSeatsAndDeleteBooking = inngest.createFunction(
     { id: 'release-seats-delete-booking' },
     { event: "app/checkpayment" },
     async ({ event, step }) => {
        // Stripe's minimum expiry is 30 mins
     const thirtyMinutesLater = new Date(Date.now() + 30 * 60 * 1000); 
     await step.sleepUntil('wait-for-30-minutes', thirtyMinutesLater);

     await step.run('check-payment-status', async () => {
     const bookingId = event.data.bookingId;
     const booking = await Booking.findById(bookingId);

     // Only run if the booking *still exists* AND is *not paid*
     if (booking && !booking.isPaid) { 
     console.log(`Payment not received for booking ${bookingId}. Releasing seats.`);
    const show = await Show.findById(booking.show);
    if (show && show.occupiedSeats) {
     booking.bookedSeats.forEach((seat) => {
     delete show.occupiedSeats[seat];
     });
     show.markModified('occupiedSeats');
     await show.save();
     }
     await Booking.findByIdAndDelete(booking._id);
     console.log(`Booking ${bookingId} deleted.`);
     } else if (!booking) {
 console.log(`Booking ${bookingId} was already processed (paid). No action taken.`);
 } else if (booking.isPaid) {
console.log(`Booking ${bookingId} was paid. No action taken.`);
     }
    });
    }
);

// --- UPDATED EMAIL FUNCTION ---
const sendBookingConfirmationEmail = inngest.createFunction(
    { id: "send-booking-confirmation-email" },
    { event: "app/show.booked" },
    async ({ event, step }) => {
        const { bookingId } = event.data;

        // Add a 5-second sleep to prevent race conditions with the database
        await step.sleep('wait-for-db-update', '5s');

        try {
            // --- 1. POPULATE THE THEATER DETAILS ---
            const booking = await Booking.findById(bookingId)
                .populate('user')
                .populate({
                    path: 'show',
                    populate: [
                        { path: "movie", model: "Movie" },
                        { path: "theater", model: "Theater" } // <-- Add this
                    ]
                });

            // Check if all data is present
            if (!booking) {
                throw new Error(`Booking not found for ID: ${bookingId}.`);
            }
            if (!booking.user) {
                throw new Error(`User not found for booking ID: ${bookingId}`);
            }
            if (!booking.show || !booking.show.movie || !booking.show.theater) {
                throw new Error(`Show, movie, or theater data missing for booking ID: ${bookingId}`);
            }

            // --- 2. PREPARE THEATER AND SHOW DETAILS ---
            const user = booking.user;
            const movie = booking.show.movie;
            const theater = booking.show.theater;
            const showTime = new Date(booking.show.showDateTime);

            console.log(`Sending booking email for ${user.email}...`);

            // --- 3. ADD THEATER INFO TO THE EMAIL BODY ---
            await sendEmail({
                to: user.email,
                subject: `Payment Confirmation: "${movie.title}" booked!`,
                body: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #F84565;">Hi ${user.name},</h2>
                        <p>Your booking for <strong style="color: #F84565;">"${movie.title}"</strong> is confirmed.</p>
                        
                        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f9f9f9;">
                            <h3 style="margin-top: 0;">Your Ticket Details:</h3>
                            <p>
                                <strong>Movie:</strong> ${movie.title}<br>
                                <strong>Date:</strong> ${showTime.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'long', year: 'numeric' })}<br>
                                <strong>Time:</strong> ${showTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p>
                                <strong>Theater:</strong> ${theater.location?.address?.city}, ${theater.location?.address?.state}<br>
                                <strong>Address:</strong> ${theater.location?.address?.street1}<br>
                                <strong>Seats:</strong> ${booking.bookedSeats.join(', ')}<br>
                                <strong>Total:</strong> $${booking.amount.toFixed(2)}
                            </p>
                        </div>
                        
                        <p style="margin-top: 20px;">Enjoy the show!</p>
                        <p>
                            Thanks for booking with us!
                            <br>
                            - QuickShow Team
                        </p>
                    </div>
                `
            });

            console.log("Booking email sent successfully.");
            return { success: true, message: "Email sent." };

        } catch (error) {
            console.error("Failed to send booking email:", error);
            throw error; // Re-throw to make Inngest retry
        }
    }
);
// --- END OF UPDATED FUNCTION ---


// --- (keep sendShowReminders, but fix typos) ---
const sendShowReminders = inngest.createFunction(
    { id: "send-show-reminders" },
    { cron: "0 */8 * * *" }, // Runs every 8 hours
    async ({ step }) => {
        const now = new Date();
        const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000); 

        const reminderTasks = await step.run(
            "prepare-reminder-tasks", async () => {
                const shows = await Show.find({
                    showDateTime: { $gte: windowStart, $lte: in8Hours }, // <-- FIXED typo
                }).populate('movie');

                const tasks = [];
                for (const show of shows) {
                    if (!show.movie || !show.occupiedSeats) continue;

                    const userIds = [...new Set(Object.values(show.occupiedSeats))];
                    if (userIds.length === 0) continue;

                    const users = await User.find({ _id: { $in: userIds } }).select("name email");

                    for (const user of users) {
                        tasks.push({
                            userEmail: user.email,
                            userName: user.name,
                            movieTitle: show.movie.title,
                            showTime: show.showDateTime,
                        });
                    }
                }
                return tasks;
            });

        if (reminderTasks.length === 0) {
            return { sent: 0, message: "No reminders to send." }
        }

        const results = await step.run('send-all-reminders', async () => {
            return await Promise.allSettled(
                reminderTasks.map(task => sendEmail({
                    to: task.userEmail,
                    subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
                    body: `
                        <div style="font-family: Arial, sans-serif; padding: 20px;">
                            <h2>Hello ${task.userName},</h2>
                            <p>This is a quick reminder that your movie:</p>
                            <h3 style="color: #F84565;">"${task.movieTitle}"</h3>
                            <p>
                                is scheduled for <strong>${new Date(task.showTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</strong> 
                                at <strong>${new Date(task.showTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}</strong>.
                            </p>
                            <p>It starts in approximately <strong>8 hours</strong>, make sure you're ready!</p>
                            <br/>
                            <p>Enjoy the show!<br/>QuickShow Team</p>
                        </div>
                    `
                }))
            )
        });
        const sent = results.filter(r => r.status === "fulfilled").length;
        const failed = results.length - sent;
        return { sent, failed, message: `Sent ${sent} reminder(s), ${failed} failed.` }
    }
);

// --- (keep sendNewShowNotifications) ---
const sendNewShowNotifications = inngest.createFunction(
    { id: "send-new-show-notifcations" },
    { event: "app/show.added" },
    async ({ event }) => {
        const { movieTitle } = event.data;
        const users = await User.find({});
        for (const user of users) {
            const userEmail = user.email;
            const userName = user.name;
            const subject = `New Show Added: ${movieTitle}`;
            const body = `
                <div style="font-family: Arial, sans-serif; padding: 20px; ">
                    <h2>Hi ${userName},</h2>
                    <p>We've just added a new show to our library:</p>
                    <h3 style="color: #F84565;">"${movieTitle}"</h3>
                    <p>Visit our website</p>
                    <br/>
                    <p>Thanks,<br/>QuickShow Team</p>
                </div>
            `;
            try {
                await sendEmail({ to: userEmail, subject, body });
            } catch (error) {
                console.error(`Failed to send new show notification to ${userEmail}:`, error);
            }
        }
        return { message: "Notifications Sent." }
    }
);

// Export all functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking,
    sendBookingConfirmationEmail,
    sendShowReminders,
    sendNewShowNotifications,
];