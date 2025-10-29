import dotenv from "dotenv";
dotenv.config();

import sendEmail from "./configs/nodemailer.js";

const test = async () => {
  try {
    const response = await sendEmail({
      to: "yourtestemail@example.com",
      subject: "Test Email from Brevo",
      body: "<h2>This is a test email from Nodemailer + Brevo setup</h2>",
    });
    console.log("✅ Email sent successfully:", response);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
};

test();
