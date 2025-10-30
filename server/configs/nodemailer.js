import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // your Brevo email/login
    pass: process.env.SMTP_PASS, // your Brevo SMTP key
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html,
    });
    console.log(" Email sent:", info.messageId);
  } catch (error) {
    console.error(" Email sending failed:", error.message);
    throw error;
  }
};
