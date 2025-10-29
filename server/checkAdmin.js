import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});
const User = mongoose.model("User", userSchema);

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to DB");

    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      console.log("👑 Admin found:");
      console.log(adminUser);
    } else {
      console.log("⚠️ No admin user found in the database.");
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};

checkAdmin();
