const Event = require("../models/Event");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const AuditLog = require("../models/AuditLog");

// ==========================================
// Get All Events with Search, Filter, Sort & Pagination
// GET /api/events
// ==========================================
const getEvents = async (req, res, next) => {
  try {
    const {
      search,
      category,
      language,
      status,
      minRating,
      maxPrice,
      sortBy,
      page = 1,
      limit = 9,
    } = req.query;

    const query = {};

    // Requirement 8: Backend Search by title, description, category, language
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { language: searchRegex },
      ];
    }

    // Requirement 9: Filtering
    if (category && category !== "All") {
      query.category = category;
    }

    if (language && language !== "All") {
      query.language = new RegExp(`^${language}$`, "i");
    }

    if (status && status !== "All") {
      query.status = status.toUpperCase();
    } else {
      // By default show active events unless specified
      if (!req.user || req.user.role !== "ADMIN") {
        query.status = "ACTIVE";
      }
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (maxPrice) {
      query.basePrice = { $lte: Number(maxPrice) };
    }

    // Sorting
    let sortOptions = { releaseDate: -1 }; // default newest
    if (sortBy === "rating_desc") {
      sortOptions = { rating: -1 };
    } else if (sortBy === "price_asc") {
      sortOptions = { basePrice: 1 };
    } else if (sortBy === "price_desc") {
      sortOptions = { basePrice: -1 };
    } else if (sortBy === "date_asc") {
      sortOptions = { releaseDate: 1 };
    } else if (sortBy === "date_desc") {
      sortOptions = { releaseDate: -1 };
    }

    // Requirement 10: Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const totalEvents = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalEvents / limitNum) || 1;

    const events = await Event.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      events,
      movies: events, // backward compatibility
      currentPage: pageNum,
      totalPages,
      totalEvents,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Single Event by ID
// GET /api/events/:id
// ==========================================
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
      movie: event, // backward compatibility
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Create Event (Admin Only)
// POST /api/events
// ==========================================
const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      language,
      duration,
      poster,
      rating,
      releaseDate,
      status,
      basePrice,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category || "Movie",
      language: language || "English",
      duration: duration || 120,
      poster:
        poster ||
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
      rating: rating !== undefined ? Number(rating) : 4.5,
      releaseDate: releaseDate || new Date(),
      status: status || "ACTIVE",
      basePrice: basePrice || 150,
      genre: category || "Movie",
    });

    // Record audit log
    await AuditLog.create({
      userId: req.user?.id,
      action: "EVENT_CREATED",
      description: `Event created: "${event.title}" [${event.category}]`,
      metadata: { eventId: event._id },
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
      movie: event,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Event (Admin Only)
// PUT /api/events/:id
// ==========================================
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await AuditLog.create({
      userId: req.user?.id,
      action: "EVENT_UPDATED",
      description: `Event updated: "${event.title}"`,
      metadata: { eventId: event._id },
    });

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Event (Admin Only)
// DELETE /api/events/:id
// Rule 9: Deleting an event must not create orphaned shows/bookings
// ==========================================
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check for shows associated with this event
    const activeShows = await Show.find({
      $or: [{ eventId: event._id }, { movie: event._id }],
    });

    if (activeShows.length > 0) {
      // Check if any of these shows have active bookings
      const showIds = activeShows.map((s) => s._id);
      const activeBookings = await Booking.find({
        showId: { $in: showIds },
        bookingStatus: "CONFIRMED",
      });

      if (activeBookings.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete event: There are active confirmed bookings for its scheduled shows. Cancel or complete the shows first.",
        });
      }

      // If no confirmed bookings exist, remove the shows safely
      await Show.deleteMany({ _id: { $in: showIds } });
    }

    await Event.findByIdAndDelete(event._id);

    await AuditLog.create({
      userId: req.user?.id,
      action: "EVENT_DELETED",
      description: `Event deleted: "${event.title}"`,
      metadata: { eventId: event._id },
    });

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
