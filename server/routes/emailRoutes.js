import express from "express";
import { sendEmail } from "../configs/nodemailer.js"; 

const router = express.Router();

router.post("/send", async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    await sendEmail({
      to,
      subject,
      html: `<p>${message}</p>`,
    });
    res.json({ message: "✅ Email sent successfully!" });
  } catch (error) {
    console.error("❌ Email error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
