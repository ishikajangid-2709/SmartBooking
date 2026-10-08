const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },

    date: {
      type: Date,
      required: [true, "Show date is required"],
    },

    startTime: {
      type: String,
      required: [true, "Show start time is required"], // e.g. "18:30" or "06:30 PM"
    },

    endTime: {
      type: String,
      default: "",
    },

    priceMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.5,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED", "COMPLETED"],
      default: "ACTIVE",
    },

    bookedSeats: {
      type: [String],
      default: [],
    },

    // Compatibility fields for existing frontend / endpoints
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: function () {
        return this.eventId;
      },
    },

    theatre: {
      type: String,
      default: "Main Screen",
    },

    price: {
      type: Number,
      default: 150,
    },

    totalSeats: {
      type: Number,
      default: 40,
    },
  },
  {
    timestamps: true,
  }
);

// Populate helper hook to guarantee both eventId and movie point to the same document
showSchema.pre("save", function () {
  if (this.eventId && !this.movie) {
    this.movie = this.eventId;
  }
  if (this.movie && !this.eventId) {
    this.eventId = this.movie;
  }
});

module.exports = mongoose.model("Show", showSchema);