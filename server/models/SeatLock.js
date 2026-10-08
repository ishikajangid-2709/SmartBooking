const mongoose = require("mongoose");

const seatLockSchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
      index: true,
    },

    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lockedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to guarantee no two active locks exist on the same seat in the same show
seatLockSchema.index({ showId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model("SeatLock", seatLockSchema);
