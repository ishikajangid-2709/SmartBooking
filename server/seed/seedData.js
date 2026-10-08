const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Event = require("../models/Event");
const Venue = require("../models/Venue");
const Seat = require("../models/Seat");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const SeatLock = require("../models/SeatLock");
const AuditLog = require("../models/AuditLog");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/movieTicketDB";
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("Connected to database. Purging old data...");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Event.deleteMany({}),
      Venue.deleteMany({}),
      Seat.deleteMany({}),
      Show.deleteMany({}),
      Booking.deleteMany({}),
      SeatLock.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log("Old data cleared. Creating Users...");

    // 1. Create Admin & User (Requirement 43)
    const admin = await User.create({
      name: "Super Admin",
      email: "admin@example.com",
      password: "Admin@123",
      role: "ADMIN",
      status: "ACTIVE",
    });

    const user1 = await User.create({
      name: "John Doe",
      email: "user@example.com",
      password: "User@123",
      role: "USER",
      status: "ACTIVE",
    });

    const user2 = await User.create({
      name: "Jane Smith",
      email: "jane@example.com",
      password: "User@123",
      role: "USER",
      status: "ACTIVE",
    });

    console.log("Users created successfully.");
    console.log("Creating Venues & Seats...");

    // 2. Create Venues & Seats (Requirement 11 & 12)
    const venuesData = [
      {
        name: "PVR City Mall - Audi 1",
        city: "Mumbai",
        address: "Level 4, Phoenix Marketcity, Kurla West",
        rows: 5,
        columns: 8,
        totalSeats: 40,
      },
      {
        name: "IMAX Grand Horizon",
        city: "Delhi",
        address: "Select Citywalk, Saket District Centre",
        rows: 5,
        columns: 8,
        totalSeats: 40,
      },
      {
        name: "Royal Opera House",
        city: "Bengaluru",
        address: "Brigade Road, Ashok Nagar",
        rows: 5,
        columns: 8,
        totalSeats: 40,
      },
      {
        name: "Eden Symphony Arena",
        city: "Kolkata",
        address: "Salt Lake Stadium Complex, Sector 3",
        rows: 5,
        columns: 8,
        totalSeats: 40,
      },
    ];

    const venues = await Venue.insertMany(venuesData);

    // Insert seats for each venue
    for (const venue of venues) {
      const seats = [];
      for (let r = 0; r < venue.rows; r++) {
        const rowChar = String.fromCharCode(65 + r);
        let type = "REGULAR";
        let price = 150;

        if (r >= venue.rows - 1) {
          type = "VIP";
          price = 400;
        } else if (r >= 2) {
          type = "PREMIUM";
          price = 250;
        }

        for (let c = 1; c <= venue.columns; c++) {
          seats.push({
            venueId: venue._id,
            seatNumber: `${rowChar}${c}`,
            row: rowChar,
            column: c,
            type,
            price,
          });
        }
      }
      await Seat.insertMany(seats);
    }

    console.log("Venues and seats generated.");
    console.log("Creating Events...");

    // 3. Create Events (Requirement 7)
    const eventsData = [
      {
        title: "Avengers: Secret Wars",
        description:
          "Earth's mightiest heroes face a multiversal collapse that threatens all reality. The ultimate battle across timelines unfolds in this epic cinematic showdown.",
        category: "Movie",
        language: "English",
        duration: 180,
        poster:
          "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&auto=format&fit=crop&q=60",
        rating: 4.9,
        releaseDate: new Date("2026-05-15"),
        status: "ACTIVE",
        basePrice: 250,
      },
      {
        title: "Coldplay: Music of the Spheres Tour",
        description:
          "Experience a magical, cosmic night of music, synchronized LED wristbands, laser spectacles, and timeless anthems from Coldplay live on stage.",
        category: "Concert",
        language: "English",
        duration: 150,
        poster:
          "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=60",
        rating: 4.8,
        releaseDate: new Date("2026-06-20"),
        status: "ACTIVE",
        basePrice: 400,
      },
      {
        title: "ICC World Championship Finals: India vs Australia",
        description:
          "The crowning rivalry in world sports! Watch high-octane cricketing excellence, breathtaking boundaries, and heart-stopping nail-biters live from prime stadium seats.",
        category: "Sports",
        language: "English",
        duration: 240,
        poster:
          "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60",
        rating: 4.9,
        releaseDate: new Date("2026-07-10"),
        status: "ACTIVE",
        basePrice: 350,
      },
      {
        title: "Phantom of the Opera: Musical Extravaganza",
        description:
          "The legendary romantic masterpiece featuring opulent orchestrations, sublime vocals, and breathtaking period costumes in a world-class theatre setting.",
        category: "Theatre",
        language: "English",
        duration: 140,
        poster:
          "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=60",
        rating: 4.7,
        releaseDate: new Date("2026-08-05"),
        status: "ACTIVE",
        basePrice: 200,
      },
      {
        title: "Global AI & Cloud Architecture Summit 2026",
        description:
          "Learn directly from visionary engineers, principal architects, and DeepMind pioneers exploring autonomous agentic workflows and distributed systems at scale.",
        category: "Conference",
        language: "English",
        duration: 360,
        poster:
          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
        rating: 4.6,
        releaseDate: new Date("2026-09-12"),
        status: "ACTIVE",
        basePrice: 150,
      },
      {
        title: "Masterclass: Full-Stack System Design & DSA",
        description:
          "An intensive, hands-on workshop covering high-concurrency architectures, atomic locking mechanisms, indexing strategies, and enterprise placement interview problems.",
        category: "Workshop",
        language: "English",
        duration: 210,
        poster:
          "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60",
        rating: 4.9,
        releaseDate: new Date("2026-10-01"),
        status: "ACTIVE",
        basePrice: 150,
      },
    ];

    const events = await Event.insertMany(eventsData);

    console.log("Events created. Creating Shows...");

    // 4. Create Shows for Events (Requirement 13)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2); // 2 days in future (> 24 hours for 100% refund test!)

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const showsData = [
      {
        eventId: events[0]._id,
        movie: events[0]._id,
        venueId: venues[0]._id,
        theatre: `${venues[0].name} (${venues[0].city})`,
        date: tomorrow,
        startTime: "19:30",
        showTime: "07:30 PM",
        endTime: "22:30",
        priceMultiplier: 1.0,
        price: 250,
        totalSeats: 40,
        bookedSeats: ["A1", "A2", "B7", "B8"],
        status: "ACTIVE",
      },
      {
        eventId: events[0]._id,
        movie: events[0]._id,
        venueId: venues[1]._id,
        theatre: `${venues[1].name} (${venues[1].city})`,
        date: tomorrow,
        startTime: "21:00",
        showTime: "09:00 PM",
        endTime: "00:00",
        priceMultiplier: 1.2,
        price: 300,
        totalSeats: 40,
        bookedSeats: ["C4", "C5"],
        status: "ACTIVE",
      },
      {
        eventId: events[1]._id,
        movie: events[1]._id,
        venueId: venues[3]._id,
        theatre: `${venues[3].name} (${venues[3].city})`,
        date: nextWeek,
        startTime: "18:00",
        showTime: "06:00 PM",
        endTime: "20:30",
        priceMultiplier: 1.0,
        price: 400,
        totalSeats: 40,
        bookedSeats: ["E1", "E2", "E3"],
        status: "ACTIVE",
      },
      {
        eventId: events[2]._id,
        movie: events[2]._id,
        venueId: venues[1]._id,
        theatre: `${venues[1].name} (${venues[1].city})`,
        date: nextWeek,
        startTime: "14:00",
        showTime: "02:00 PM",
        endTime: "18:00",
        priceMultiplier: 1.0,
        price: 350,
        totalSeats: 40,
        bookedSeats: [],
        status: "ACTIVE",
      },
      {
        eventId: events[3]._id,
        movie: events[3]._id,
        venueId: venues[2]._id,
        theatre: `${venues[2].name} (${venues[2].city})`,
        date: tomorrow,
        startTime: "17:00",
        showTime: "05:00 PM",
        endTime: "19:20",
        priceMultiplier: 1.0,
        price: 200,
        totalSeats: 40,
        bookedSeats: [],
        status: "ACTIVE",
      },
    ];

    const shows = await Show.insertMany(showsData);

    console.log("Shows created. Creating Sample Bookings...");

    // 5. Create Sample Bookings for User 1 (Requirement 20)
    await Booking.create({
      bookingId: "EVT-2026-84921",
      userId: user1._id,
      user: user1._id,
      showId: shows[0]._id,
      show: shows[0]._id,
      seats: ["A1", "A2"],
      seatDetails: [
        { seatNumber: "A1", type: "REGULAR", price: 150 },
        { seatNumber: "A2", type: "REGULAR", price: 150 },
      ],
      subtotal: 300,
      convenienceFee: 50,
      tax: 54,
      totalAmount: 404,
      paymentStatus: "PAID",
      bookingStatus: "CONFIRMED",
      bookedAt: new Date(),
    });

    // 6. Create Initial Audit Logs (Requirement 34)
    await AuditLog.create({
      userId: admin._id,
      action: "DATABASE_SEEDED",
      description: "Initial database seed completed with sample users, venues, events, and shows",
    });

    console.log("-----------------------------------------------------------------");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("-----------------------------------------------------------------");
    console.log("Test Credentials:");
    console.log("👉 ADMIN: email: admin@example.com | password: Admin@123 | role: ADMIN");
    console.log("👉 USER:  email: user@example.com  | password: User@123  | role: USER");
    console.log("-----------------------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed with error:", error);
    process.exit(1);
  }
};

seedDatabase();
