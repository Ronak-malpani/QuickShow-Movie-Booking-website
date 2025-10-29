import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});
const User = mongoose.model("User", userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to DB");

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists:", existingAdmin.email);
    } else {
      const hashedPassword = await bcrypt.hash("Admin@123", 10);
      const newAdmin = new User({
        name: "Admin",
        email: "admin@quickshow.com",
        password: hashedPassword,
        role: "admin",
      });
      await newAdmin.save();
      console.log("✅ Admin user created successfully!");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};

createAdmin();
