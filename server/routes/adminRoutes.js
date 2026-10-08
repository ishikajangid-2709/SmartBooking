const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAnalytics,
  getUsers,
  toggleUserStatus,
  getAuditLogs,
  getAllBookings,
} = require("../controllers/adminController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// All admin routes protected by verifyToken and verifyAdmin
router.use(verifyToken, verifyAdmin);

// Dashboard Summary Stats (Requirement 31)
router.get("/dashboard", getDashboardStats);

// Analytics & Reports (Requirement 32)
router.get("/analytics", getAnalytics);

// User Management (Requirement 33)
router.get("/users", getUsers);
router.put("/users/:id/status", toggleUserStatus);

// Audit Logs (Requirement 34)
router.get("/audit-logs", getAuditLogs);

// Bookings Management
router.get("/bookings", getAllBookings);

module.exports = router;