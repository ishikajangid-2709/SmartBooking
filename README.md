# 🎟️ Smart Event & Seat Booking Management System

An advanced full-stack web application for reserving seats for movies, concerts, sports events, theatre shows, and workshops. Features real-time interactive seat layouts, temporary 2-minute locking with concurrency race-condition prevention, server-side tamper-proof price calculation, automated refund tier engine, and DSA-based seat recommendations.

---

## 🌟 Key Highlights & Engineering Features

* **Multi-Category Events**: Supports Movies, Concerts, Sports, Theatre, Workshops, and Conferences.
* **Role-Based Access Control (RBAC)**: Distinct permissions for `USER` and `ADMIN` with protected API middleware and frontend route guards.
* **Temporary 2-Minute Seat Locking**: Database is the single source of truth. Prevents double-booking across concurrent users using atomic operations.
* **Concurrency & Race Condition Handling**: Enforced by MongoDB compound unique indexes (`{ showId: 1, seatNumber: 1 }`). Conflicting simultaneous attempts yield `409 Conflict`.
* **Tamper-Proof Pricing Engine**: Total amounts, seat tier multipliers (VIP: ₹400, Premium: ₹250, Regular: ₹150), convenience fees, and 18% GST are computed strictly on the backend.
* **Dynamic Refund Cancellation Policy**:
  * More than 24 hours prior to show: **100% refund**
  * Between 6 and 24 hours prior: **75% refund**
  * Less than 6 hours prior: **0% refund**
* **DSA Seat Selection Algorithms**:
  1. **Consecutive Seat Finder**: Sliding-window row scan in $\mathcal{O}(R \times C)$ time.
  2. **Best Seat Recommendation**: Multi-factor fitness evaluation (center column proximity, screen viewing row distance, price tier optimization).
  3. **Availability & Occupancy Analysis**: Linear-time real-time metric counter.
* **Executive Admin Dashboard**: Real-time revenue analytics (Today, This Week, This Month), booking trends visualization, seat occupancy meters, user management, and security audit logs.
* **E-Ticket Generation**: Instant PDF ticket generation and QR code creation.

---

## 🏗️ Repository Architecture

This repository houses both the frontend and backend in a unified structure:

```text
Movie-Ticket-Booking/
├── client/                      # React Frontend (Vite, React 19, Bootstrap, Axios)
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute
│   │   ├── context/             # AuthContext (State & Token management)
│   │   ├── pages/               # Events, SeatSelection, BookingConfirmation, MyBookings, Admin pages
│   │   ├── services/            # Axios API client with Bearer token interceptor
│   │   └── App.jsx              # Client-side router configuration
│   └── package.json
│
├── server/                      # Express Backend (Node.js, Express, MongoDB, Mongoose)
│   ├── config/                  # Database connection
│   ├── controllers/             # Auth, Events, Venues, Shows, Seats, Bookings, Admin
│   ├── middleware/              # JWT authMiddleware, centralized errorHandler
│   ├── models/                  # User, Event, Venue, Seat, Show, SeatLock, Booking, AuditLog
│   ├── routes/                  # Express REST routes
│   ├── seed/                    # Seed script with test accounts, venues, and shows
│   ├── test/                    # Automated test verification suite
│   ├── utils/                   # DSA Seat Algorithms
│   ├── server.js                # Server entry point & background lock cleanup daemon
│   └── package.json
│
├── .gitignore                   # Root gitignore (excludes node_modules, build, .env)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MongoDB](https://www.mongodb.com/) (v6 or higher running locally on port 27017 or MongoDB Atlas URI)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/Movie-Ticket-Booking.git
cd Movie-Ticket-Booking
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (or copy from `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/movieTicketDB
JWT_SECRET=movieTicketBookingSecret123
```

Seed the database with test events, venues, seats, shows, and accounts:
```bash
npm run seed
```

Run the backend automated test suite to verify test cases:
```bash
node test/systemTests.js
```

Start the backend server:
```bash
npm run dev
# Server running at http://localhost:5000
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
# Frontend running at http://localhost:5173
```

---

## 🔑 Test Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `Admin@123` | Full administrative control, analytics, CRUD for events/venues/shows, audit logs |
| **USER** | `user@example.com` | `User@123` | Browsing, search, seat locking, booking, cancellation, booking history |
| **USER 2** | `jane@example.com` | `User@123` | Secondary user for testing concurrent locking and ownership isolation |

---

## 🧪 Automated Verification Suite (11/11 Passed)

Run:
```bash
cd server && node test/systemTests.js
```

* **Test Case 1 — Duplicate Registration**: Rejects duplicate email with `409 Conflict`.
* **Test Case 2 — Invalid Login**: Rejects invalid credentials with `401 Unauthorized`.
* **Test Case 3 — Unauthorized Admin Access**: Blocks standard users with `403 Forbidden`.
* **Test Case 4 — Seat Conflict Prevention**: Second concurrent lock on same seat yields `409 Conflict`.
* **Test Case 5 — Temporary Seat Lock State**: Validates lock state in availability API.
* **Test Case 6 — Booking Confirmation**: Atomic transition from `LOCKED` $\rightarrow$ `BOOKED` with human-readable `EVT-YYYY-XXXXX` ID.
* **Test Case 7 — Invalid Booking Without Lock**: Rejects booking attempt if user holds no valid unexpired lock.
* **Test Case 8 — Price Manipulation Defense**: Server computes authentic price and discards client tampering.
* **Test Case 9 — Booking Ownership Protection**: Non-owner access blocked with `403 Forbidden`.
* **Test Case 10 — Cancellation Refund (>24h = 100%)**: Validates automated refund percentage calculation.
* **DSA Seat Recommendation**: Validates optimal contiguous group closest to center view.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | User / Admin |
| `GET` | `/api/events` | List events with search, filter, sort, pagination | Public |
| `GET` | `/api/events/:id` | Get single event details | Public |
| `POST` | `/api/events` | Create new event | Admin |
| `PUT` | `/api/events/:id` | Update event details | Admin |
| `DELETE` | `/api/events/:id` | Delete event (safeguards orphan bookings) | Admin |
| `GET` | `/api/venues` | List venues | Public |
| `POST` | `/api/venues` | Create venue & auto-generate seat matrix | Admin |
| `GET` | `/api/shows` | List shows with filters | Public |
| `GET` | `/api/shows/:showId/seats` | Real-time seat status (`AVAILABLE`, `LOCKED`, `BOOKED`) | Public / User |
| `POST` | `/api/shows` | Schedule new show | Admin |
| `POST` | `/api/seats/lock` | Acquire 2-minute temporary lock | User |
| `POST` | `/api/seats/unlock` | Release temporary seat lock early | User |
| `POST` | `/api/seats/recommend` | DSA seat recommendation (Consecutive / Best view) | Public |
| `POST` | `/api/bookings` | Confirm booking & mark seats booked | User |
| `GET` | `/api/bookings/my` | User's bookings (Upcoming, Completed, Cancelled) | User |
| `GET` | `/api/bookings/:id` | Single booking details (ownership protected) | User / Admin |
| `PUT` | `/api/bookings/:id/cancel` | Cancel booking with tiered refund calculation | User / Admin |
| `GET` | `/api/admin/dashboard` | KPI cards & platform telemetry | Admin |
| `GET` | `/api/admin/analytics` | Period revenue, 7-day trends, occupancy | Admin |
| `GET` | `/api/admin/users` | User directory with status toggle | Admin |
| `GET` | `/api/admin/audit-logs` | Filterable immutable system audit trail | Admin |

---

## 📄 License
ISC License. Built for Advanced Placement Full-Stack Engineering Assessment.
