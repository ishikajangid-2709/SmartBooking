const express = require("express");
const router = express.Router();

const {
  lockSeats,
  unlockSeats,
  getSeatRecommendations,
} = require("../controllers/seatController");
const { verifyToken } = require("../middleware/authMiddleware");

// Temporary seat lock (Requirement 18)
router.post("/lock", verifyToken, lockSeats);

// Early seat unlock
router.post("/unlock", verifyToken, unlockSeats);

// DSA recommendation endpoint (Requirements 28, 29)
router.post("/recommend", getSeatRecommendations);

module.exports = router;
