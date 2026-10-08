const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    totalSeats: {
      type: Number,
      default: 40,
    },

    rows: {
      type: Number,
      default: 5, // Rows A through E
    },

    columns: {
      type: Number,
      default: 8, // Columns 1 through 8
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Venue", venueSchema);
