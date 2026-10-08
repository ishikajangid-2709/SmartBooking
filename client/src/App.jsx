import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// User & Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import SeatSelection from "./pages/SeatSelection";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminEvents from "./pages/AdminEvents";
import AdminVenues from "./pages/AdminVenues";
import AdminShows from "./pages/AdminShows";
import AdminBookings from "./pages/AdminBookings";
import AdminUsers from "./pages/AdminUsers";
import AdminAuditLogs from "./pages/AdminAuditLogs";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Authentication Routes */}
          <Route path="/" element={<Events />} />
          <Route path="/home" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<Events />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Event & Show Details */}
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/movie/:id" element={<EventDetails />} />
          <Route path="/shows/:id" element={<EventDetails />} />

          {/* Protected User Booking Flows */}
          <Route
            path="/seats/:showId"
            element={
              <ProtectedRoute>
                <SeatSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Navigate to="/my-bookings" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes (Role: ADMIN required) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={<Navigate to="/admin" replace />}
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-movies"
            element={<Navigate to="/admin/events" replace />}
          />
          <Route
            path="/add-movie"
            element={<Navigate to="/admin/events" replace />}
          />
          <Route
            path="/admin/venues"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminVenues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shows"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminShows />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/events" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;