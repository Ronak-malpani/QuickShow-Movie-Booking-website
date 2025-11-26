import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // REQUIRED for Gmail App Password
  auth: {
    user: process.env.GMAIL_EMAIL,         // your gmail (noreply)
    pass: process.env.GMAIL_APP_PASSWORD,  // Gmail app password
  },
});

const sendEmail = async ({ to, subject, htmlBody, textBody }) => {
  try {
    console.log("📤 Attempting to send email...");
    console.log("To:", to);
    console.log("Using Gmail:", process.env.GMAIL_EMAIL);

    const info = await transporter.sendMail({
      from: process.env.GMAIL_EMAIL,
      to,
      subject,
      html: htmlBody || "",
      text: textBody || (htmlBody ? htmlBody.replace(/<[^>]+>/g, "") : ""),
    });

    console.log(" Email sent successfully:", info.response);
    return info;
  } catch (err) {
    console.error(" Failed to send email:", err);
    throw err;
  }
};

export default sendEmail;
