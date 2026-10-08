const express = require("express");
const router = express.Router();

const {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
} = require("../controllers/venueController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// Public routes
router.get("/", getVenues);
router.get("/:id", getVenueById);

// Admin-only routes (Requirement 11)
router.post("/", verifyToken, verifyAdmin, createVenue);
router.put("/:id", verifyToken, verifyAdmin, updateVenue);
router.delete("/:id", verifyToken, verifyAdmin, deleteVenue);

module.exports = router;
