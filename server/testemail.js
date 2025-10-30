import dotenv from "dotenv";
import { sendEmail } from "./configs/nodemailer.js";

dotenv.config();

(async () => {
  try {
    await sendEmail({
      to: "malpanironak11@gmail.com", // 👈 your test email address
      subject: "QuickShow Email Test",
      html: "<h1>Test Email from QuickShow 🎬</h1><p>This is a test email sent from Nodemailer via Brevo SMTP.</p>",
    });
    console.log("✅ Test email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
})();
