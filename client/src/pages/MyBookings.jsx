import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Link } from "react-router-dom";

function MyBookings() {
  const [categorizedBookings, setCategorizedBookings] = useState({
    upcoming: [],
    completed: [],
    cancelled: [],
  });
  const [allBookings, setAllBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cancel Modal state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/bookings/my");
      if (res.data?.success) {
        setAllBookings(res.data.bookings || []);
        if (res.data.categorized) {
          setCategorizedBookings(res.data.categorized);
        } else {
          // Fallback categorization
          const now = new Date();
          const upcoming = [];
          const completed = [];
          const cancelled = [];

          (res.data.bookings || []).forEach((b) => {
            if (b.bookingStatus === "CANCELLED") {
              cancelled.push(b);
            } else {
              const show = b.show || b.showId;
              const showDate = show?.date ? new Date(show.date) : new Date(b.createdAt);
              if (showDate >= now) {
                upcoming.push(b);
              } else {
                completed.push(b);
              }
            }
          });
          setCategorizedBookings({ upcoming, completed, cancelled });
        }
      }
    } catch (err) {
      setError("Failed to fetch bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate refund percentage preview for a booking
  const getRefundPreview = (booking) => {
    const show = booking.show || booking.showId;
    if (!show?.date) return { percentage: 0, amount: 0 };

    const showDateTime = new Date(show.date);
    if (show.startTime) {
      const parts = show.startTime.split(":");
      if (parts.length >= 2) {
        showDateTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
      }
    }

    const diffHours = (showDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    let percentage = 0;
    if (diffHours > 24) percentage = 100;
    else if (diffHours >= 6) percentage = 75;
    else percentage = 0;

    const amount = Math.round((booking.totalAmount * percentage) / 100);
    return { percentage, amount, diffHours: Math.max(0, diffHours.toFixed(1)) };
  };

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    setCancelling(true);
    try {
      const res = await API.put(`/bookings/${selectedBookingForCancel._id}/cancel`);
      if (res.data?.success) {
        alert(
          `Booking cancelled! Refund Amount: ₹${res.data.refundAmount} (${res.data.refundPercentage}%)`
        );
        setCancelModalOpen(false);
        setSelectedBookingForCancel(null);
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  // Download PDF E-Ticket
  const handleDownloadTicket = async (booking) => {
    const doc = new jsPDF();
    const show = booking.show || booking.showId;
    const event = show?.eventId || show?.movie;

    const qrData = `BOOKING_ID: ${booking.bookingId || booking._id} | EVENT: ${
      event?.title || "Event"
    } | SEATS: ${booking.seats.join(", ")} | TOTAL: INR ${booking.totalAmount}`;
    const qrImage = await QRCode.toDataURL(qrData);

    // Title bar
    doc.setFillColor(229, 9, 20);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("EVENT E-TICKET", 105, 18, { align: "center" });

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(14);
    doc.text(`Booking ID: ${booking.bookingId || booking._id}`, 20, 45);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Status: ${booking.bookingStatus}`, 20, 53);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 58, 190, 58);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(event?.title || "Event Title", 20, 70);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Venue: ${show?.theatre || show?.venueId?.name || "Main Screen"}`, 20, 80);
    doc.text(
      `Date: ${new Date(show?.date || booking.createdAt).toLocaleDateString()}`,
      20,
      90
    );
    doc.text(`Time: ${show?.startTime || show?.showTime || "7:30 PM"}`, 20, 100);
    doc.text(`Seats: ${booking.seats.join(", ")}`, 20, 110);
    doc.text(`Total Amount: INR ${booking.totalAmount}`, 20, 120);

    // QR Image
    doc.addImage(qrImage, "PNG", 130, 65, 55, 55);

    doc.save(`Ticket_${booking.bookingId || booking._id}.pdf`);
  };

  const currentList = categorizedBookings[activeTab] || [];

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-ticket-perforated text-danger me-2"></i> My Bookings
            </h2>
            <p className="text-secondary small mb-0">
              Manage your reserved tickets, download boarding passes, or process cancellations.
            </p>
          </div>

          <Link to="/events" className="btn btn-danger rounded-pill px-4 fw-semibold">
            <i className="bi bi-plus-circle me-1"></i> Book New Event
          </Link>
        </div>

        {/* Tab Controls (Upcoming, Completed, Cancelled) */}
        <div className="d-flex gap-2 mb-4 p-1 rounded-pill bg-dark d-inline-flex border border-secondary border-opacity-25">
          <button
            className={`btn btn-sm rounded-pill px-4 fw-semibold ${
              activeTab === "upcoming" ? "btn-danger" : "btn-link text-secondary text-decoration-none"
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming ({categorizedBookings.upcoming.length})
          </button>

          <button
            className={`btn btn-sm rounded-pill px-4 fw-semibold ${
              activeTab === "completed" ? "btn-danger" : "btn-link text-secondary text-decoration-none"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({categorizedBookings.completed.length})
          </button>

          <button
            className={`btn btn-sm rounded-pill px-4 fw-semibold ${
              activeTab === "cancelled" ? "btn-danger" : "btn-link text-secondary text-decoration-none"
            }`}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled ({categorizedBookings.cancelled.length})
          </button>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading your booking history...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && currentList.length === 0 && (
          <div
            className="text-center py-5 rounded-4"
            style={{ background: "#1a1c24", border: "1px dashed #3a3e4e" }}
          >
            <span className="fs-1">🎟️</span>
            <h5 className="text-white mt-3">No {activeTab} Bookings</h5>
            <p className="text-secondary mb-3">
              You do not have any {activeTab} bookings on your account right now.
            </p>
            <Link to="/events" className="btn btn-outline-light rounded-pill px-4">
              Explore Events
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && currentList.length > 0 && (
          <div className="row g-4">
            {currentList.map((booking) => {
              const show = booking.show || booking.showId;
              const event = show?.eventId || show?.movie;
              const refund = getRefundPreview(booking);
              const isCancelled = booking.bookingStatus === "CANCELLED";

              return (
                <div key={booking._id} className="col-lg-6">
                  <div
                    className="card border-0 shadow-lg h-100 overflow-hidden"
                    style={{
                      background: "#1a1c24",
                      borderRadius: "20px",
                      border: "1px solid #2a2d39",
                    }}
                  >
                    <div className="row g-0 h-100">
                      {/* Event Poster Thumbnail */}
                      <div className="col-sm-4 bg-dark">
                        <img
                          src={
                            event?.poster ||
                            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60"
                          }
                          alt={event?.title || "Poster"}
                          style={{
                            height: "100%",
                            minHeight: "220px",
                            width: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>

                      {/* Booking Card Body */}
                      <div className="col-sm-8 p-4 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge bg-secondary small">
                              {event?.category || "Event"}
                            </span>
                            <span
                              className={`badge ${
                                isCancelled ? "bg-danger" : "bg-success"
                              }`}
                            >
                              {booking.bookingStatus}
                            </span>
                          </div>

                          <h5 className="fw-bold text-white mb-1">
                            {event?.title || "Event Title"}
                          </h5>

                          <p className="text-secondary small mb-3">
                            <i className="bi bi-geo-alt text-danger me-1"></i>
                            {show?.theatre || show?.venueId?.name || "Main Venue"}
                          </p>

                          <div className="small text-secondary mb-3">
                            <div>
                              📅{" "}
                              <strong className="text-white">
                                {new Date(show?.date || booking.createdAt).toLocaleDateString()}
                              </strong>{" "}
                              at{" "}
                              <strong className="text-white">
                                {show?.startTime || show?.showTime || "7:30 PM"}
                              </strong>
                            </div>
                            <div className="mt-1">
                              🎟 Seats:{" "}
                              <span className="text-warning fw-semibold">
                                {booking.seats.join(", ")}
                              </span>
                            </div>
                            <div className="mt-1">
                              💰 Total:{" "}
                              <strong className="text-danger fs-6">
                                ₹{booking.totalAmount}
                              </strong>{" "}
                              <span className="badge bg-dark text-secondary ms-1">
                                {booking.paymentStatus}
                              </span>
                            </div>
                            <div className="mt-1 font-monospace" style={{ fontSize: "11px" }}>
                              ID: {booking.bookingId || booking._id}
                            </div>

                            {isCancelled && booking.refundAmount > 0 && (
                              <div className="mt-2 text-info small">
                                ℹ️ Refunded: ₹{booking.refundAmount}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-25 mt-2">
                          <button
                            className="btn btn-sm btn-outline-success rounded-pill px-3"
                            onClick={() => handleDownloadTicket(booking)}
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i> E-Ticket
                          </button>

                          {!isCancelled && activeTab === "upcoming" && (
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              onClick={() => handleOpenCancelModal(booking)}
                            >
                              <i className="bi bi-x-circle me-1"></i> Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Confirmation Modal with Refund Tier Preview (Requirement 27) */}
        {cancelModalOpen && selectedBookingForCancel && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ background: "rgba(0, 0, 0, 0.75)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content text-white p-2"
                style={{ background: "#1a1c24", borderRadius: "20px", border: "1px solid #363a4d" }}
              >
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-danger">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i> Cancel Booking
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setCancelModalOpen(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <p className="text-secondary small mb-3">
                    Are you sure you want to cancel booking{" "}
                    <strong className="text-white">
                      {selectedBookingForCancel.bookingId || selectedBookingForCancel._id}
                    </strong>
                    ? This will release your seats.
                  </p>

                  {/* Refund Rules Breakdown */}
                  {(() => {
                    const refundInfo = getRefundPreview(selectedBookingForCancel);
                    return (
                      <div
                        className="p-3 rounded-3 mb-3"
                        style={{ background: "#252834", border: "1px solid #363a4d" }}
                      >
                        <h6 className="fw-bold text-warning mb-2">
                          <i className="bi bi-shield-check me-1"></i> Cancellation Refund Policy
                        </h6>
                        <ul className="small text-secondary ps-3 mb-3">
                          <li>&gt; 24 hours prior to show: <strong>100% refund</strong></li>
                          <li>6 – 24 hours prior to show: <strong>75% refund</strong></li>
                          <li>&lt; 6 hours prior to show: <strong>0% refund</strong></li>
                        </ul>

                        <div className="border-top border-secondary border-opacity-25 pt-2 small">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-secondary">Time to Show:</span>
                            <span className="text-white fw-semibold">
                              ~{refundInfo.diffHours} hours
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-secondary">Refund Rate:</span>
                            <span className="text-success fw-bold">
                              {refundInfo.percentage}%
                            </span>
                          </div>
                          <div className="d-flex justify-content-between fs-6 fw-bold">
                            <span className="text-white">Calculated Refund:</span>
                            <span className="text-success">₹{refundInfo.amount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setCancelModalOpen(false)}
                  >
                    Keep Booking
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger rounded-pill px-4 fw-semibold"
                    disabled={cancelling}
                    onClick={handleConfirmCancel}
                  >
                    {cancelling ? "Processing..." : "Confirm Cancellation"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MyBookings;