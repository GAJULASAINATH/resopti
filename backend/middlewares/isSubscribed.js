// middleware/isSubscribed.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const isSubscribed = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

    // Fetch user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check subscription
    if (!user.is_subscribed) {
      return res.status(403).json({ message: "Subscription required" });
    }

    // Attach user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = isSubscribed;
