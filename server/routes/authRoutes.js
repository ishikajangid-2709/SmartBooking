const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Register Route (Requirement 4)
router.post("/register", registerUser);

// Login Route (Requirement 5)
router.post("/login", loginUser);

// Profile Route
router.get("/me", verifyToken, getMe);

module.exports = router;