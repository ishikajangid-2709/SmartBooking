import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (statusFilter !== "All") params.status = statusFilter;

      const res = await API.get("/admin/bookings", { params });
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      setError("Failed to fetch bookings record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-receipt text-danger me-2"></i> All Bookings Directory
            </h2>
            <p className="text-secondary small mb-0">
              Audit and monitor customer booking transactions and refunds.
            </p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
              &laquo; Dashboard
            </Link>

            <select
              className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill px-3"
              style={{ width: "160px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading transactions...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && (
          <div
            className="card border-0 shadow overflow-hidden"
            style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
          >
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead style={{ background: "#252834" }}>
                  <tr>
                    <th scope="col" className="ps-4">Booking ID</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Event & Venue</th>
                    <th scope="col">Seats</th>
                    <th scope="col">Total Paid</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="pe-4">Booked At</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-secondary">
                        No bookings matching criteria found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => {
                      const user = booking.user || booking.userId;
                      const show = booking.show || booking.showId;
                      const event = show?.eventId || show?.movie;

                      return (
                        <tr key={booking._id}>
                          <td className="ps-4">
                            <span className="font-monospace text-warning fw-semibold">
                              {booking.bookingId || booking._id}
                            </span>
                          </td>
                          <td>
                            <strong className="text-white d-block">{user?.name || "Guest"}</strong>
                            <span className="text-secondary small">{user?.email}</span>
                          </td>
                          <td>
                            <strong className="text-white d-block">{event?.title || "Event"}</strong>
                            <span className="text-secondary small">
                              {show?.theatre || show?.venueId?.name || "Venue"}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {booking.seats.map((seat) => (
                                <span
                                  key={seat}
                                  className="badge bg-secondary font-monospace"
                                  style={{ fontSize: "11px" }}
                                >
                                  {seat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-danger fw-bold fs-6">
                            ₹{booking.totalAmount}
                            {booking.refundAmount > 0 && (
                              <div className="text-info small fw-normal">
                                Refund: ₹{booking.refundAmount}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                booking.bookingStatus === "CONFIRMED"
                                  ? "bg-success"
                                  : "bg-danger"
                              }`}
                            >
                              {booking.bookingStatus}
                            </span>
                          </td>
                          <td className="text-secondary small pe-4">
                            {new Date(booking.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminBookings;
