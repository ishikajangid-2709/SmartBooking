const Venue = require("../models/Venue");
const Seat = require("../models/Seat");
const Show = require("../models/Show");

// Helper to generate seat layout for a venue
const generateVenueSeats = async (venueId, rows = 5, cols = 8) => {
  const seatsToInsert = [];

  for (let r = 0; r < rows; r++) {
    const rowChar = String.fromCharCode(65 + r); // 'A', 'B', 'C', ...

    // Row tier pricing:
    // A-B: REGULAR (₹150)
    // C-D: PREMIUM (₹250)
    // E+: VIP (₹400)
    let type = "REGULAR";
    let price = 150;

    if (r >= rows - 1) {
      type = "VIP";
      price = 400;
    } else if (r >= 2) {
      type = "PREMIUM";
      price = 250;
    }

    for (let c = 1; c <= cols; c++) {
      seatsToInsert.push({
        venueId,
        seatNumber: `${rowChar}${c}`,
        row: rowChar,
        column: c,
        type,
        price,
      });
    }
  }

  await Seat.insertMany(seatsToInsert);
  return seatsToInsert;
};

// ==========================================
// Get All Venues (GET /api/venues)
// ==========================================
const getVenues = async (req, res, next) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: venues.length,
      venues,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Single Venue with Seats (GET /api/venues/:id)
// ==========================================
const getVenueById = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    const seats = await Seat.find({ venueId: venue._id }).sort({
      row: 1,
      column: 1,
    });

    res.status(200).json({
      success: true,
      venue,
      seats,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Create Venue (Admin Only) (POST /api/venues)
// ==========================================
const createVenue = async (req, res, next) => {
  try {
    const { name, city, address, rows = 5, columns = 8 } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, city, and address are required",
      });
    }

    const totalSeats = rows * columns;

    const venue = await Venue.create({
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      rows,
      columns,
      totalSeats,
    });

    // Automatically initialize seats
    await generateVenueSeats(venue._id, rows, columns);

    res.status(201).json({
      success: true,
      message: "Venue and seat layout created successfully",
      venue,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Update Venue (Admin Only) (PUT /api/venues/:id)
// ==========================================
const updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Venue updated successfully",
      venue,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Delete Venue (Admin Only) (DELETE /api/venues/:id)
// ==========================================
const deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    // Check if any shows exist at this venue
    const activeShows = await Show.find({ venueId: venue._id });
    if (activeShows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete venue: Active shows are scheduled at this venue",
      });
    }

    await Seat.deleteMany({ venueId: venue._id });
    await Venue.findByIdAndDelete(venue._id);

    res.status(200).json({
      success: true,
      message: "Venue and associated seats deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  generateVenueSeats,
};
