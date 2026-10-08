const Show = require("../models/Show");
const Event = require("../models/Event");
const Venue = require("../models/Venue");
const Seat = require("../models/Seat");
const SeatLock = require("../models/SeatLock");
const AuditLog = require("../models/AuditLog");
const { analyzeSeatAvailability } = require("../utils/dsaSeatAlgorithms");

// ==========================================
// Get Shows (GET /api/shows)
// Filter by eventId, venueId, date
// ==========================================
const getShows = async (req, res, next) => {
  try {
    const { eventId, movieId, venueId, date } = req.query;
    const filter = {};

    const targetEvent = eventId || movieId;
    if (targetEvent) {
      filter.$or = [{ eventId: targetEvent }, { movie: targetEvent }];
    }

    if (venueId) {
      filter.venueId = venueId;
    }

    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: searchDate, $lt: nextDay };
    }

    const shows = await Show.find(filter)
      .populate("eventId")
      .populate("movie")
      .populate("venueId")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Shows by Event/Movie ID (GET /api/shows/event/:eventId or GET /api/shows/:movieId)
// ==========================================
const getShowsByMovie = async (req, res, next) => {
  try {
    const targetId = req.params.movieId || req.params.eventId;

    const shows = await Show.find({
      $or: [{ eventId: targetId }, { movie: targetId }],
      status: "ACTIVE",
    })
      .populate("eventId")
      .populate("movie")
      .populate("venueId")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: shows.length,
      shows,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Single Show Details (GET /api/shows/:id or /api/shows/details/:id)
// ==========================================
const getShowById = async (req, res, next) => {
  try {
    const showId = req.params.id || req.params.showId;
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

    res.status(200).json({
      success: true,
      show,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Requirement 14: Show Seat Availability
// GET /api/shows/:showId/seats
// Returns real-time status of every seat: AVAILABLE, LOCKED, BOOKED
// ==========================================
const getShowSeats = async (req, res, next) => {
  try {
    const showId = req.params.showId || req.params.id;
    const currentUserId = req.user ? req.user.id : null;

    const show = await Show.findById(showId).populate("venueId");
    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    const now = new Date();

    // 1. Fetch venue seats (or generate default 5x8 if venue not populated)
    let seats = [];
    if (show.venueId) {
      seats = await Seat.find({ venueId: show.venueId._id || show.venueId }).sort({
        row: 1,
        column: 1,
      });
    }

    // Fallback: If no venue seats in database, generate standard 5x8 seats
    if (!seats || seats.length === 0) {
      seats = [];
      for (let r = 0; r < 5; r++) {
        const rowChar = String.fromCharCode(65 + r);
        let type = "REGULAR";
        let price = 150;
        if (r >= 4) {
          type = "VIP";
          price = 400;
        } else if (r >= 2) {
          type = "PREMIUM";
          price = 250;
        }

        for (let c = 1; c <= 8; c++) {
          seats.push({
            seatNumber: `${rowChar}${c}`,
            row: rowChar,
            column: c,
            type,
            price,
          });
        }
      }
    }

    // 2. Fetch active, unexpired locks for this show
    // Expired locks (expiresAt <= now) are automatically ignored (Requirement 19)
    const activeLocks = await SeatLock.find({
      showId: show._id,
      expiresAt: { $gt: now },
    });

    const activeLockMap = new Map();
    activeLocks.forEach((lock) => {
      activeLockMap.set(lock.seatNumber, lock);
    });

    const bookedSet = new Set(show.bookedSeats || []);

    // 3. Map seat statuses
    const seatAvailabilityList = seats.map((seat) => {
      const seatObj = seat.toObject ? seat.toObject() : seat;
      const seatNum = seatObj.seatNumber;

      let status = "AVAILABLE";
      let lockedByMe = false;
      let lockExpiresAt = null;

      if (bookedSet.has(seatNum)) {
        status = "BOOKED";
      } else if (activeLockMap.has(seatNum)) {
        const lock = activeLockMap.get(seatNum);
        status = "LOCKED";
        lockExpiresAt = lock.expiresAt;
        if (currentUserId && lock.userId.toString() === currentUserId.toString()) {
          lockedByMe = true;
        }
      }

      // Calculate effective price taking show price multiplier into account
      const basePrice = seatObj.price || 150;
      const effectivePrice = Math.round(basePrice * (show.priceMultiplier || 1.0));

      return {
        ...seatObj,
        effectivePrice,
        status,
        lockedByMe,
        lockExpiresAt,
      };
    });

    // 4. DSA Requirement 3: Availability & Occupancy Analysis
    const lockedSeatNumbers = Array.from(activeLockMap.keys());
    const availabilityMetrics = analyzeSeatAvailability(
      seatAvailabilityList,
      Array.from(bookedSet),
      lockedSeatNumbers
    );

    res.status(200).json({
      success: true,
      showId: show._id,
      seats: seatAvailabilityList,
      metrics: availabilityMetrics,
      currentServerTime: now,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Create Show (Admin Only) (POST /api/shows)
// ==========================================
const addShow = async (req, res, next) => {
  try {
    const {
      eventId,
      movie,
      venueId,
      theatre,
      date,
      startTime,
      showTime,
      endTime,
      priceMultiplier,
      price,
    } = req.body;

    const actualEventId = eventId || movie;
    if (!actualEventId) {
      return res.status(400).json({
        success: false,
        message: "Event is required",
      });
    }

    const event = await Event.findById(actualEventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Selected event not found",
      });
    }

    // Find venue or pick first available venue
    let actualVenueId = venueId;
    let theatreName = theatre || "Grand Auditorium";
    if (actualVenueId) {
      const venue = await Venue.findById(actualVenueId);
      if (venue) {
        theatreName = `${venue.name} (${venue.city})`;
      }
    } else {
      const anyVenue = await Venue.findOne();
      if (anyVenue) {
        actualVenueId = anyVenue._id;
        theatreName = `${anyVenue.name} (${anyVenue.city})`;
      }
    }

    const showDate = date ? new Date(date) : new Date();
    const actualStartTime = startTime || showTime || "18:00";

    const show = await Show.create({
      eventId: actualEventId,
      movie: actualEventId,
      venueId: actualVenueId,
      theatre: theatreName,
      date: showDate,
      startTime: actualStartTime,
      showTime: actualStartTime,
      endTime: endTime || "",
      priceMultiplier: priceMultiplier ? Number(priceMultiplier) : 1.0,
      price: price ? Number(price) : (event.basePrice || 150),
      status: "ACTIVE",
      bookedSeats: [],
    });

    await AuditLog.create({
      userId: req.user?.id,
      action: "SHOW_CREATED",
      description: `Show created for "${event.title}" on ${showDate.toLocaleDateString()} at ${actualStartTime}`,
      metadata: { showId: show._id, eventId: actualEventId },
    });

    res.status(201).json({
      success: true,
      message: "Show added successfully",
      show,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Show (Admin Only) (PUT /api/shows/:id)
// ==========================================
const updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Show (Admin Only) (DELETE /api/shows/:id)
// ==========================================
const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Check if show has confirmed bookings
    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete show: seats have already been booked for this show",
      });
    }

    await SeatLock.deleteMany({ showId: show._id });
    await Show.findByIdAndDelete(show._id);

    res.status(200).json({
      success: true,
      message: "Show deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShows,
  getShowsByMovie,
  getShowById,
  getShowSeats,
  addShow,
  updateShow,
  deleteShow,
};