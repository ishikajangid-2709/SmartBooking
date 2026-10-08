const Show = require("../models/Show");
const Seat = require("../models/Seat");
const SeatLock = require("../models/SeatLock");
const AuditLog = require("../models/AuditLog");
const {
  findConsecutiveSeats,
  recommendBestSeats,
  analyzeSeatAvailability,
} = require("../utils/dsaSeatAlgorithms");

// Lock duration in milliseconds (2 minutes = 120 seconds)
const LOCK_DURATION_MS = 2 * 60 * 1000;

// ==========================================
// Lock Seats (POST /api/seats/lock)
// Requirements 16, 17, 18, 19
// ==========================================
const lockSeats = async (req, res, next) => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user.id;

    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "showId and seatIds array are required",
      });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    if (show.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "This show is no longer active for bookings",
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

    // 1. Check if any requested seat is already permanently BOOKED
    const alreadyBooked = seatIds.some((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: "One or more selected seats are unavailable",
      });
    }

    // 2. Clean up any expired locks for this show across the system (Requirement 19)
    await SeatLock.deleteMany({
      showId: show._id,
      expiresAt: { $lte: now },
    });

    // 3. Concurrency Protection (Requirement 17):
    // Check if any seat is currently held by ANOTHER user with a valid (unexpired) lock
    const conflictingLocks = await SeatLock.find({
      showId: show._id,
      seatNumber: { $in: seatIds },
      userId: { $ne: userId },
      expiresAt: { $gt: now },
    });

    if (conflictingLocks.length > 0) {
      // Test Case 4: Seat Conflict -> 409 Conflict
      return res.status(409).json({
        success: false,
        message: "One or more selected seats are unavailable",
        conflictingSeats: conflictingLocks.map((l) => l.seatNumber),
      });
    }

    // 4. Atomically upsert locks for the current user for all selected seats
    // If the user already held previous locks for different seats in this show, remove old unselected ones
    await SeatLock.deleteMany({
      showId: show._id,
      userId,
      seatNumber: { $nin: seatIds },
    });

    // Upsert locks for the selected seats
    const lockPromises = seatIds.map((seatNumber) =>
      SeatLock.findOneAndUpdate(
        { showId: show._id, seatNumber },
        {
          $set: {
            userId,
            lockedAt: now,
            expiresAt,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    await Promise.all(lockPromises);

    // Record audit log
    await AuditLog.create({
      userId,
      action: "SEAT_LOCKED",
      description: `Seats locked: [${seatIds.join(", ")}] for show ${showId}`,
      metadata: { showId, seatIds, expiresAt },
    });

    return res.status(200).json({
      success: true,
      message: "Seats locked successfully",
      expiresAt,
      lockDurationSeconds: 120,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Unlock Seats Early (POST /api/seats/unlock)
// ==========================================
const unlockSeats = async (req, res, next) => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user.id;

    if (!showId) {
      return res.status(400).json({
        success: false,
        message: "showId is required",
      });
    }

    const query = { showId, userId };
    if (Array.isArray(seatIds) && seatIds.length > 0) {
      query.seatNumber = { $in: seatIds };
    }

    await SeatLock.deleteMany(query);

    return res.status(200).json({
      success: true,
      message: "Seats unlocked successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DSA Seat Recommendation (POST /api/seats/recommend)
// Requirements 28, 29, 30
// ==========================================
const getSeatRecommendations = async (req, res, next) => {
  try {
    const { showId, count = 2, strategy = "best", type = null } = req.body;
    const currentUserId = req.user ? req.user.id : null;

    const show = await Show.findById(showId).populate("venueId");
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    const numSeats = Math.max(1, parseInt(count, 10));

    // Get all seats for the venue
    let seats = [];
    if (show.venueId) {
      seats = await Seat.find({ venueId: show.venueId._id || show.venueId }).sort({
        row: 1,
        column: 1,
      });
    }

    if (!seats || seats.length === 0) {
      seats = [];
      for (let r = 0; r < 5; r++) {
        const rowChar = String.fromCharCode(65 + r);
        let seatType = "REGULAR";
        let price = 150;
        if (r >= 4) {
          seatType = "VIP";
          price = 400;
        } else if (r >= 2) {
          seatType = "PREMIUM";
          price = 250;
        }

        for (let c = 1; c <= 8; c++) {
          seats.push({
            seatNumber: `${rowChar}${c}`,
            row: rowChar,
            column: c,
            type: seatType,
            price,
          });
        }
      }
    }

    const now = new Date();

    // Active locks held by OTHER users are unavailable
    const activeLocks = await SeatLock.find({
      showId: show._id,
      expiresAt: { $gt: now },
      ...(currentUserId && { userId: { $ne: currentUserId } }),
    });

    const unavailableSeatNumbers = new Set([
      ...(show.bookedSeats || []),
      ...activeLocks.map((l) => l.seatNumber),
    ]);

    let recommendationResult;

    if (strategy === "consecutive") {
      // DSA Requirement 28: Find Consecutive Seats in Same Row
      const consecutiveSeats = findConsecutiveSeats(
        seats,
        Array.from(unavailableSeatNumbers),
        numSeats
      );
      recommendationResult = {
        strategy: "consecutive",
        seats: consecutiveSeats,
        found: consecutiveSeats.length === numSeats,
        reason:
          consecutiveSeats.length === numSeats
            ? `Found ${numSeats} consecutive seats in the same row`
            : `Could not find ${numSeats} consecutive seats in a single row`,
      };
    } else {
      // DSA Requirement 29: Best Seat Recommendation (Center Proximity, Contiguity, Price)
      const best = recommendBestSeats(
        seats,
        Array.from(unavailableSeatNumbers),
        numSeats,
        type
      );
      recommendationResult = {
        strategy: "best",
        seats: best.recommendedSeats,
        found: best.recommendedSeats.length === numSeats,
        totalPrice: best.totalPrice,
        reason: best.reason,
      };
    }

    res.status(200).json({
      success: true,
      recommendation: recommendationResult,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  lockSeats,
  unlockSeats,
  getSeatRecommendations,
};
