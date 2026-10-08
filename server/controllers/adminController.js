const User = require("../models/User");
const Event = require("../models/Event");
const Venue = require("../models/Venue");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const SeatLock = require("../models/SeatLock");
const AuditLog = require("../models/AuditLog");

// ==========================================
// Requirement 31: Admin Dashboard Stats
// GET /api/admin/dashboard
// ==========================================
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalVenues = await Venue.countDocuments();
    const totalShows = await Show.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({
      bookingStatus: "CONFIRMED",
    });
    const cancelledBookings = await Booking.countDocuments({
      bookingStatus: "CANCELLED",
    });

    // Revenue aggregation (only confirmed bookings)
    const revenueAggregation = await Booking.aggregate([
      { $match: { bookingStatus: "CONFIRMED" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue =
      revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalVenues,
        totalShows,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Requirement 32: Admin Analytics
// GET /api/admin/analytics
// ==========================================
const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();

    // Today's start
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Week start (7 days ago)
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Month start (30 days ago)
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Revenue today
    const revToday = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "CONFIRMED",
          createdAt: { $gte: startOfToday },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Revenue this week
    const revWeek = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "CONFIRMED",
          createdAt: { $gte: startOfWeek },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Revenue this month
    const revMonth = await Booking.aggregate([
      {
        $match: {
          bookingStatus: "CONFIRMED",
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // 7-day daily booking trend
    const sevenDaysTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ["$bookingStatus", "CONFIRMED"] }, "$totalAmount", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Popular Events (ranked by confirmed bookings)
    const popularEvents = await Booking.aggregate([
      { $match: { bookingStatus: "CONFIRMED" } },
      {
        $lookup: {
          from: "shows",
          localField: "showId",
          foreignField: "_id",
          as: "show",
        },
      },
      { $unwind: { path: "$show", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "events",
          localField: "show.eventId",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$event._id",
          title: { $first: "$event.title" },
          category: { $first: "$event.category" },
          poster: { $first: "$event.poster" },
          bookingsCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 },
    ]);

    // Active shows seat occupancy stats
    const shows = await Show.find({ status: "ACTIVE" });
    let totalVenueSeats = 0;
    let totalBookedSeats = 0;

    shows.forEach((s) => {
      totalVenueSeats += s.totalSeats || 40;
      totalBookedSeats += s.bookedSeats ? s.bookedSeats.length : 0;
    });

    const activeLocksCount = await SeatLock.countDocuments({
      expiresAt: { $gt: now },
    });

    const totalAvailableSeats = Math.max(
      0,
      totalVenueSeats - (totalBookedSeats + activeLocksCount)
    );

    res.status(200).json({
      success: true,
      analytics: {
        revenue: {
          today: revToday[0]?.total || 0,
          thisWeek: revWeek[0]?.total || 0,
          thisMonth: revMonth[0]?.total || 0,
        },
        bookingTrends: sevenDaysTrend,
        popularEvents,
        occupancy: {
          totalSeats: totalVenueSeats,
          bookedSeats: totalBookedSeats,
          lockedSeats: activeLocksCount,
          availableSeats: totalAvailableSeats,
          rate:
            totalVenueSeats > 0
              ? Number(
                  (
                    ((totalBookedSeats + activeLocksCount) / totalVenueSeats) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Requirement 33: Admin User Management
// GET /api/admin/users
// ==========================================
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user status (ACTIVE / BLOCKED)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.status = user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    await user.save();

    await AuditLog.create({
      userId: req.user.id,
      action: "USER_STATUS_UPDATED",
      description: `User ${user.email} status changed to ${user.status}`,
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Requirement 34: Admin Audit Logs
// GET /api/admin/audit-logs
// ==========================================
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, limit = 50 } = req.query;
    const filter = {};

    if (action && action !== "All") {
      filter.action = action;
    }

    const logs = await AuditLog.find(filter)
      .populate("userId", "name email role")
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Admin View All Bookings
// GET /api/admin/bookings
// ==========================================
const getAllBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "All") {
      filter.bookingStatus = status;
    }

    const bookings = await Booking.find(filter)
      .populate("userId", "name email")
      .populate("user", "name email")
      .populate({
        path: "showId",
        populate: ["eventId", "movie", "venueId"],
      })
      .populate({
        path: "show",
        populate: ["eventId", "movie", "venueId"],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAnalytics,
  getUsers,
  toggleUserStatus,
  getAuditLogs,
  getAllBookings,
};
