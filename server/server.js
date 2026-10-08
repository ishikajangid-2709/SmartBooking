const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const movieRoutes = require("./routes/movieRoutes");
const venueRoutes = require("./routes/venueRoutes");
const showRoutes = require("./routes/showRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");
const SeatLock = require("./models/SeatLock");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "🎟 Smart Event & Seat Booking Management System API",
    version: "2.0.0",
  });
});

// Periodic expired seat lock cleanup task (Requirement 19)
setInterval(async () => {
  try {
    const result = await SeatLock.deleteMany({
      expiresAt: { $lte: new Date() },
    });
    if (result.deletedCount > 0) {
      // console.log(`[Cleaner] Expired seat locks cleaned up: ${result.deletedCount}`);
    }
  } catch (err) {
    // console.error("[Cleaner] Error cleaning expired locks:", err.message);
  }
}, 30000);

// Centralized Error Handling Middleware (Requirement 35)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;