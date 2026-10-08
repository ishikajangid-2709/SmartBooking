import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import QRCode from "qrcode";
import jsPDF from "jspdf";

function BookingConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get(`/bookings/${id}`);
      if (res.data?.success) {
        const b = res.data.booking;
        setBooking(b);

        // Generate QR Code
        const qrString = `BOOKING_ID: ${b.bookingId || b._id} | EVENT: ${
          b.show?.eventId?.title || b.show?.movie?.title || "Event"
        } | SEATS: ${b.seats.join(", ")} | TOTAL: INR ${b.totalAmount}`;

        const qrUrl = await QRCode.toDataURL(qrString, { width: 160, margin: 1 });
        setQrCodeDataUrl(qrUrl);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load booking confirmation details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!booking) return;

    const doc = new jsPDF();
    const show = booking.show || booking.showId;
    const event = show?.eventId || show?.movie;

    // Header Band
    doc.setFillColor(229, 9, 20);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SMART EVENT E-TICKET", 105, 18, { align: "center" });

    // Body
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.text(`Booking ID: ${booking.bookingId || booking._id}`, 20, 45);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Status: ${booking.bookingStatus}`, 20, 55);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 60, 190, 60);

    // Event Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Event: ${event?.title || "Event"}`, 20, 72);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Venue: ${show?.theatre || show?.venueId?.name || "Main Venue"}`, 20, 82);
    doc.text(
      `Date: ${new Date(show?.date || booking.createdAt).toLocaleDateString()}`,
      20,
      92
    );
    doc.text(`Show Time: ${show?.startTime || show?.showTime || "7:30 PM"}`, 20, 102);
    doc.text(`Seats Reserved: ${booking.seats.join(", ")}`, 20, 112);
    doc.text(`Subtotal: INR ${booking.subtotal}`, 20, 122);
    doc.text(`Taxes & Fees: INR ${booking.convenienceFee + booking.tax}`, 20, 132);

    doc.setFont("helvetica", "bold");
    doc.text(`Total Paid: INR ${booking.totalAmount}`, 20, 144);

    // QR Code
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, "PNG", 130, 70, 60, 60);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Scan at Entrance", 160, 135, { align: "center" });
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Please arrive 15 minutes prior to the show time. Present this e-ticket at the venue gate.",
      105,
      170,
      { align: "center" }
    );

    doc.save(`Ticket_${booking.bookingId || booking._id}.pdf`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5 vh-100 d-flex flex-column justify-content-center align-items-center">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-secondary mt-3">Loading booking confirmation...</p>
        </div>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="alert alert-danger">{error || "Booking not found"}</div>
          <Link to="/events" className="btn btn-outline-light rounded-pill px-4 mt-3">
            &laquo; Browse Events
          </Link>
        </div>
      </>
    );
  }

  const show = booking.show || booking.showId;
  const event = show?.eventId || show?.movie;

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            {/* Success Card */}
            <div
              className="card border-0 shadow-lg p-4 p-md-5 text-center"
              style={{
                background: "#1a1c24",
                borderRadius: "24px",
                border: "1px solid #2a2d39",
              }}
            >
              {/* Checkmark Animation */}
              <div className="mb-4">
                <div
                  className="rounded-circle d-inline-flex justify-content-center align-items-center bg-success bg-opacity-25"
                  style={{ width: "90px", height: "90px" }}
                >
                  <i className="bi bi-check-circle-fill text-success fs-1"></i>
                </div>
                <h2 className="fw-bold text-white mt-3 mb-1">Booking Confirmed!</h2>
                <p className="text-secondary small">
                  Your seats are successfully reserved. E-ticket has been generated.
                </p>
              </div>

              {/* Requirement 24 Booking Details Card */}
              <div
                className="p-4 rounded-4 text-start mb-4 shadow-sm"
                style={{ background: "#252834", border: "1px solid #363a4d" }}
              >
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <span className="text-secondary small d-block">Booking ID</span>
                      <strong className="fs-5 text-warning font-monospace">
                        {booking.bookingId || booking._id}
                      </strong>
                    </div>

                    <div className="mb-3">
                      <span className="text-secondary small d-block">Event</span>
                      <h5 className="text-white fw-bold mb-0">
                        {event?.title || "Event Title"}
                      </h5>
                    </div>

                    <div className="mb-3">
                      <span className="text-secondary small d-block">Venue</span>
                      <span className="text-light">
                        {show?.theatre || show?.venueId?.name || "Main Venue"}
                      </span>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <span className="text-secondary small d-block">Date</span>
                        <span className="text-light fw-semibold">
                          {new Date(show?.date || booking.createdAt).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <div className="col-6">
                        <span className="text-secondary small d-block">Time</span>
                        <span className="text-light fw-semibold">
                          {show?.startTime || show?.showTime || "7:30 PM"}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="text-secondary small d-block">Seats Reserved</span>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {booking.seats.map((seat) => (
                          <span
                            key={seat}
                            className="badge bg-success fs-6 px-3 py-2 rounded-pill"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-secondary small d-block">Total Amount</span>
                      <span className="fs-4 fw-bold text-danger">
                        ₹{booking.totalAmount}
                      </span>
                      <span className="badge bg-success ms-2">PAID</span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="col-md-4 text-center mt-3 mt-md-0 border-start border-secondary border-opacity-25 ps-md-4">
                    {qrCodeDataUrl && (
                      <div className="p-2 bg-white rounded-3 d-inline-block shadow">
                        <img
                          src={qrCodeDataUrl}
                          alt="Ticket QR Code"
                          style={{ width: "130px", height: "130px" }}
                        />
                      </div>
                    )}
                    <p className="text-secondary small mt-2 mb-0">
                      Scan at venue gate for fast-track entry
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <button
                  className="btn btn-success px-4 py-2 rounded-pill fw-semibold shadow"
                  onClick={handleDownloadPdf}
                >
                  <i className="bi bi-file-earmark-pdf-fill me-1"></i> Download PDF Ticket
                </button>

                <Link to="/my-bookings" className="btn btn-outline-warning px-4 py-2 rounded-pill fw-semibold">
                  <i className="bi bi-ticket-perforated me-1"></i> Go to My Bookings
                </Link>

                <Link to="/events" className="btn btn-outline-light px-4 py-2 rounded-pill fw-semibold">
                  Browse More Events &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookingConfirmation;
