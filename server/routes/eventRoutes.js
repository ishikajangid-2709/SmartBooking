const express = require("express");
const router = express.Router();

const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// Public routes (Requirement 7, 8, 9, 10)
router.get("/", getEvents);
router.get("/:id", getEventById);

// Admin-only routes
router.post("/", verifyToken, verifyAdmin, createEvent);
router.put("/:id", verifyToken, verifyAdmin, updateEvent);
router.delete("/:id", verifyToken, verifyAdmin, deleteEvent);

module.exports = router;
