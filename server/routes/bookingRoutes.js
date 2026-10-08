const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/bookingController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create Booking (Requirement 22)
router.post("/", verifyToken, createBooking);

// Get Current User's Bookings (Requirement 25)
router.get("/my", verifyToken, getMyBookings);
router.get("/my-bookings", verifyToken, getMyBookings);

// Get Booking by ID (Requirement 26)
router.get("/:id", verifyToken, getBookingById);

// Cancel Booking (Requirement 27)
router.put("/:id/cancel", verifyToken, cancelBooking);
router.delete("/:id", verifyToken, cancelBooking);

module.exports = router;