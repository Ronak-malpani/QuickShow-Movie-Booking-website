import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/clerk-sdk-node";

/*export const protectAdmin = async (req, res, next) => {
  try {
    // Extract user info from token
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "No user ID found — invalid or missing token" });
    }

    // Fetch user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // Check role stored in Clerk metadata
    const role = user.publicMetadata?.role;

    if (role !== "admin") {
      return res.status(403).json({ message: "Access denied — not an admin" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectAdmin:", error);
    return res.status(403).json({ message: "Forbidden" });
  }
};*/
export const protectAdmin = (req, res, next) => {
  next(); // temporarily bypass Clerk auth for debugging
};
