const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },

    seatNumber: {
      type: String,
      required: true, // e.g. "A1", "B5"
      trim: true,
    },

    row: {
      type: String,
      required: true, // e.g. "A", "B"
      trim: true,
    },

    column: {
      type: Number,
      required: true, // e.g. 1, 2, 3
    },

    type: {
      type: String,
      enum: ["REGULAR", "PREMIUM", "VIP"],
      default: "REGULAR",
    },

    price: {
      type: Number,
      required: true,
      default: function () {
        if (this.type === "VIP") return 400;
        if (this.type === "PREMIUM") return 250;
        return 150;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique seat number per venue
seatSchema.index({ venueId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);
