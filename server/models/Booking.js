const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    seats: {
      type: [String],
      required: true,
    },

    seatDetails: [
      {
        seatNumber: String,
        type: { type: String, default: "REGULAR" },
        price: Number,
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    convenienceFee: {
      type: Number,
      required: true,
      default: 50,
    },

    tax: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "REFUNDED"],
      default: "PAID",
    },

    bookingStatus: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "COMPLETED", "EXPIRED"],
      default: "CONFIRMED",
    },

    bookedAt: {
      type: Date,
      default: Date.now,
    },

    cancelledAt: {
      type: Date,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    // Backward compatibility aliases
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: function () {
        return this.userId;
      },
    },

    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      default: function () {
        return this.showId;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure user and show aliases are set
bookingSchema.pre("save", function () {
  if (this.userId && !this.user) {
    this.user = this.userId;
  }
  if (this.user && !this.userId) {
    this.userId = this.user;
  }
  if (this.showId && !this.show) {
    this.show = this.showId;
  }
  if (this.show && !this.showId) {
    this.showId = this.show;
  }
});

module.exports = mongoose.model("Booking", bookingSchema);