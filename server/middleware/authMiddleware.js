const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalize role to uppercase
    if (decoded.role) {
      decoded.role = decoded.role.toUpperCase();
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Verify Admin Role (Requirement 6: Admin-only APIs reject normal users with 403 Forbidden)
const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role.toUpperCase();

    if (userRole !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin privileges required",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error during authorization",
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin,
};