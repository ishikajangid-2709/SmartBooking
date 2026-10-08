const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
    },

    category: {
      type: String,
      enum: ["Movie", "Concert", "Sports", "Theatre", "Workshop", "Conference"],
      default: "Movie",
      required: true,
    },

    language: {
      type: String,
      required: [true, "Language is required"],
      default: "English",
    },

    duration: {
      type: Number,
      required: [true, "Duration (in minutes) is required"],
      default: 120,
    },

    poster: {
      type: String,
      default: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60",
    },

    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },

    releaseDate: {
      type: Date,
      required: [true, "Release / Event date is required"],
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "COMPLETED"],
      default: "ACTIVE",
    },

    basePrice: {
      type: Number,
      default: 150,
    },

    // For backward compatibility with Movie model queries
    genre: {
      type: String,
      default: function () {
        return this.category;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance text search and filtering
eventSchema.index({ title: "text", description: "text", category: "text", language: "text" });
eventSchema.index({ category: 1, status: 1, releaseDate: -1 });

module.exports = mongoose.model("Event", eventSchema);
