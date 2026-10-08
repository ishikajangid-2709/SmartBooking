const Booking = require("../models/Booking");
const Show = require("../models/Show");
const Seat = require("../models/Seat");
const SeatLock = require("../models/SeatLock");
const AuditLog = require("../models/AuditLog");

// Generate unique human-readable booking ID e.g. EVT-2026-84921 (Requirement 23)
const generateBookingId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `EVT-${year}-${randomNum}`;
};

// ==========================================
// Create Booking (POST /api/bookings)
// Requirements 20, 21, 22, 23
// ==========================================
const createBooking = async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user.id;

    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "showId and valid seats array are required",
      });
    }

    // 1. Validate show
    const show = await Show.findById(showId)
      .populate("eventId")
      .populate("movie")
      .populate("venueId");

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

    // Rule 8: A completed show cannot receive a new booking
    const showDateTime = new Date(show.date);
    if (show.startTime) {
      const parts = show.startTime.split(":");
      if (parts.length >= 2) {
        showDateTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      }
    }

    if (showDateTime < now) {
      return res.status(400).json({
        success: false,
        message: "This show has already started or completed",
      });
    }

    // 2. Rule 1: A user cannot book a seat that is already BOOKED
    const alreadyBooked = seats.some((seat) => show.bookedSeats.includes(seat));
    if (alreadyBooked) {
      return res.status(400).json({
        success: false,
        message: "One or more seats are already booked",
      });
    }

    // 3. Requirements 19, 22: Verify seats are locked by the current user and have NOT expired
    // Test Case 7: Attempt to book seats without owning a valid lock -> rejected
    const userLocks = await SeatLock.find({
      showId: show._id,
      seatNumber: { $in: seats },
      userId,
      expiresAt: { $gt: now },
    });

    const lockedSeatSet = new Set(userLocks.map((l) => l.seatNumber));
    const allSeatsLockedByMe = seats.every((s) => lockedSeatSet.has(s));

    if (!allSeatsLockedByMe) {
      return res.status(400).json({
        success: false,
        message:
          "Your temporary seat lock has expired or you do not hold valid locks for all selected seats. Please select and lock seats again.",
      });
    }

    // 4. Requirement 21: Server-side Price Calculation (Never trust frontend price)
    // Fetch venue seats to identify seat tier (VIP, PREMIUM, REGULAR)
    let venueSeats = [];
    if (show.venueId) {
      venueSeats = await Seat.find({
        venueId: show.venueId._id || show.venueId,
        seatNumber: { $in: seats },
      });
    }

    const seatDetails = [];
    let subtotal = 0;
    const multiplier = show.priceMultiplier || 1.0;

    for (const seatNum of seats) {
      const foundSeat = venueSeats.find((s) => s.seatNumber === seatNum);
      let tier = "REGULAR";
      let basePrice = 150;

      if (foundSeat) {
        tier = foundSeat.type;
        basePrice = foundSeat.price;
      } else {
        // Fallback row-based pricing
        const rowChar = seatNum.charAt(0).toUpperCase();
        if (rowChar >= "E") {
          tier = "VIP";
          basePrice = 400;
        } else if (rowChar >= "C") {
          tier = "PREMIUM";
          basePrice = 250;
        } else {
          tier = "REGULAR";
          basePrice = 150;
        }
      }

      const effectivePrice = Math.round(basePrice * multiplier);
      subtotal += effectivePrice;

      seatDetails.push({
        seatNumber: seatNum,
        type: tier,
        price: effectivePrice,
      });
    }

    const convenienceFee = 50; // Fixed convenience fee ₹50
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const totalAmount = subtotal + convenienceFee + tax;

    // 5. Generate unique booking ID
    let bookingId = generateBookingId();
    let isUnique = false;
    while (!isUnique) {
      const existing = await Booking.findOne({ bookingId });
      if (!existing) {
        isUnique = true;
      } else {
        bookingId = generateBookingId();
      }
    }

    // 6. Create booking record
    const booking = await Booking.create({
      bookingId,
      userId,
      user: userId,
      showId: show._id,
      show: show._id,
      seats,
      seatDetails,
      subtotal,
      convenienceFee,
      tax,
      totalAmount,
      paymentStatus: "PAID",
      bookingStatus: "CONFIRMED",
      bookedAt: now,
    });

    // 7. Atomic update: Add seats to show.bookedSeats
    show.bookedSeats.push(...seats);
    await show.save();

    // 8. Invalidate / delete temporary locks
    await SeatLock.deleteMany({
      showId: show._id,
      seatNumber: { $in: seats },
    });

    // 9. Record audit log
    await AuditLog.create({
      userId,
      action: "BOOKING_CREATED",
      description: `Booking confirmed: ${bookingId} for show ${show._id} with seats [${seats.join(", ")}] for ₹${totalAmount}`,
      metadata: { bookingId, showId: show._id, seats, totalAmount },
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate("user", "name email")
      .populate({
        path: "show",
        populate: [
          { path: "eventId" },
          { path: "movie" },
          { path: "venueId" },
        ],
      });

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Logged-in User's Bookings
// GET /api/bookings/my and GET /api/bookings/my-bookings
// Requirement 25
// ==========================================
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      $or: [{ userId: req.user.id }, { user: req.user.id }],
    })
      .populate("userId", "name email")
      .populate({
        path: "showId",
        populate: [
          { path: "eventId" },
          { path: "movie" },
          { path: "venueId" },
        ],
      })
      .populate({
        path: "show",
        populate: [
          { path: "eventId" },
          { path: "movie" },
          { path: "venueId" },
        ],
      })
      .sort({ createdAt: -1 });

    const now = new Date();

    // Categorize into Upcoming, Completed, and Cancelled
    const categorized = {
      upcoming: [],
      completed: [],
      cancelled: [],
    };

    bookings.forEach((b) => {
      if (b.bookingStatus === "CANCELLED") {
        categorized.cancelled.push(b);
      } else {
        const show = b.showId || b.show;
        const showDate = show?.date ? new Date(show.date) : new Date(b.createdAt);
        if (showDate >= now) {
          categorized.upcoming.push(b);
        } else {
          categorized.completed.push(b);
        }
      }
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
      categorized,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Booking Details by ID
// GET /api/bookings/:id
// Requirement 26: Only owner or admin allowed
// ==========================================
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email")
      .populate({
        path: "showId",
        populate: [
          { path: "eventId" },
          { path: "movie" },
          { path: "venueId" },
        ],
      })
      .populate({
        path: "show",
        populate: [
          { path: "eventId" },
          { path: "movie" },
          { path: "venueId" },
        ],
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Test Case 9: Check ownership
    const isOwner =
      booking.userId?.toString() === req.user.id.toString() ||
      booking.user?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Cancel Booking (PUT /api/bookings/:id/cancel or DELETE /api/bookings/:id)
// Requirement 27: Strict Refund Calculation Rules
// ==========================================
const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId).populate({
      path: "showId",
      populate: ["eventId", "movie", "venueId"],
    }).populate("show");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Ownership check (Rule 6)
    const isOwner =
      booking.userId?.toString() === req.user.id.toString() ||
      booking.user?.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to cancel this booking",
      });
    }

    // Rule 7: Cannot cancel an already cancelled booking
    if (booking.bookingStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    const show = booking.showId || booking.show;
    const now = new Date();

    // Calculate show datetime
    const showDateTime = new Date(show.date);
    if (show.startTime) {
      const parts = show.startTime.split(":");
      if (parts.length >= 2) {
        showDateTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      }
    }

    const diffMs = showDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Requirement 27 Refund Rules:
    // > 24 hours: 100% refund
    // Between 6 and 24 hours: 75% refund
    // Less than 6 hours: 0% refund
    let refundPercentage = 0;
    if (diffHours > 24) {
      refundPercentage = 100;
    } else if (diffHours >= 6) {
      refundPercentage = 75;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Math.round(
      (booking.totalAmount * refundPercentage) / 100
    );

    // Release booked seats in Show
    if (show) {
      show.bookedSeats = (show.bookedSeats || []).filter(
        (seat) => !booking.seats.includes(seat)
      );
      await show.save();
    }

    // Update booking status
    booking.bookingStatus = "CANCELLED";
    booking.paymentStatus = refundAmount > 0 ? "REFUNDED" : "PAID";
    booking.cancelledAt = now;
    booking.refundAmount = refundAmount;
    await booking.save();

    // Record audit log
    await AuditLog.create({
      userId: req.user.id,
      action: "BOOKING_CANCELLED",
      description: `Booking cancelled: ${booking.bookingId || booking._id}. Refund: ₹${refundAmount} (${refundPercentage}%)`,
      metadata: {
        bookingId: booking._id,
        refundAmount,
        refundPercentage,
        diffHours,
      },
    });

    res.status(200).json({
      success: true,
      message: `Booking cancelled successfully. Refund: ₹${refundAmount} (${refundPercentage}%)`,
      refundAmount,
      refundPercentage,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};