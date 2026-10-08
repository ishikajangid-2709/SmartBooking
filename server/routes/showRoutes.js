const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const {
  getShows,
  getShowsByMovie,
  getShowById,
  getShowSeats,
  addShow,
  updateShow,
  deleteShow,
} = require("../controllers/showController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// Optional token middleware for seat layout (to identify lockedByMe)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Ignore token parse error for optional auth
    }
  }
  next();
};

// 1. Specific sub-path routes first
router.get("/details/:showId", getShowById);
router.get("/:showId/seats", optionalAuth, getShowSeats);
router.get("/event/:eventId", getShowsByMovie);

// 2. Base list route
router.get("/", getShows);

// 3. Admin routes
router.post("/", verifyToken, verifyAdmin, addShow);
router.put("/:id", verifyToken, verifyAdmin, updateShow);
router.delete("/:id", verifyToken, verifyAdmin, deleteShow);

// 4. Wildcard movie/event parameter route
router.get("/:movieId", getShowsByMovie);

module.exports = router;