// controllers/users.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// exports.addCredits = async (req, res) => {
//   try {
//     // 1) grab token from Authorization header
//     const authHeader = req.headers.authorization || req.headers.Authorization;
//     if (!authHeader) return res.status(401).json({ message: "No token provided" });

//     const token = authHeader.startsWith("Bearer ")
//       ? authHeader.split(" ")[1]
//       : authHeader;

//     // 2) verify token
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
//     } catch (err) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }

//     // 3) get userId from token payload (try common keys)
//     const userId = decoded.userId || decoded.id || decoded._id;
//     if (!userId) return res.status(401).json({ message: "Invalid token payload" });

//     // 4) update user: increment credits by 5 and set subscribed true
//     const user = await User.findByIdAndUpdate(
//       userId,
//       {
//         $inc: { credits: 5 },
//         $set: { is_subscribed: true },
//       },
//       { new: true }
//     );

//     if (!user) return res.status(404).json({ message: "User not found" });

//     return res.json({
//       message: `Credits increased by 5 and subscription activated for ${user.email}`,
//       credits: user.credits,
//       is_subscribed: user.is_subscribed,
//     });
//   } catch (error) {
//     console.error("Add credits error:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

exports.updateCredits = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) return res.status(401).json({ message: "Invalid token payload" });

    const action = req.query.action; // "add" or "reduce"

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (action === "add") {
      user.credits += 5;
      await user.save();
      return res.json({
        message: `Credits increased by 5 for ${user.email}`,
        credits: user.credits,
      });
    } 
    else if (action === "reduce") {
      if (user.credits <= 0) {
        return res.json({ message: "Renew your credits", credits: user.credits });
      }
      user.credits -= 5;
      await user.save();
      return res.json({
        message: `Credits decreased by 5 for ${user.email}`,
        credits: user.credits,
      });
    } 
    else {
      return res.status(400).json({ message: "Invalid action" });
    }

  } catch (error) {
    console.error("Update credits error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};