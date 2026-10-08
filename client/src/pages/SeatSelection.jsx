import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [error, setError] = useState("");
  const [conflictMessage, setConflictMessage] = useState("");

  // Lock Timer state
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // DSA Recommendation state
  const [dsaCount, setDsaCount] = useState(2);
  const [dsaLoading, setDsaLoading] = useState(false);
  const [dsaMessage, setDsaMessage] = useState("");

  const timerRef = useRef(null);

  useEffect(() => {
    fetchShowAndSeats();

    // Auto-refresh seats every 10 seconds to sync lock/booked states across concurrent users
    const pollInterval = setInterval(() => {
      fetchSeatsOnly();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showId]);

  // Lock countdown timer effect
  useEffect(() => {
    if (expiresAt) {
      if (timerRef.current) clearInterval(timerRef.current);

      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));

        setRemainingSeconds(diff);

        if (diff <= 0) {
          clearInterval(timerRef.current);
          setIsLockedByMe(false);
          setExpiresAt(null);
          setConflictMessage(
            "Your 2-minute seat lock has expired! Please select and lock seats again."
          );
          fetchSeatsOnly();
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAt]);

  const fetchShowAndSeats = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Fetch show details
      const showRes = await API.get(`/shows/details/${showId}`);
      setShow(showRes.data.show);

      // 2. Fetch seats & availability metrics
      const seatsRes = await API.get(`/shows/${showId}/seats`);
      setSeats(seatsRes.data.seats || []);
      setMetrics(seatsRes.data.metrics || null);

      // Check if user already holds active locks
      const myLockedSeats = (seatsRes.data.seats || [])
        .filter((s) => s.lockedByMe)
        .map((s) => s.seatNumber);

      if (myLockedSeats.length > 0) {
        setSelectedSeats(myLockedSeats);
        setIsLockedByMe(true);
        const earliestExpiry = seatsRes.data.seats.find((s) => s.lockedByMe)?.lockExpiresAt;
        if (earliestExpiry) {
          setExpiresAt(earliestExpiry);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load show seats.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatsOnly = async () => {
    try {
      const seatsRes = await API.get(`/shows/${showId}/seats`);
      if (seatsRes.data?.seats) {
        setSeats(seatsRes.data.seats);
        setMetrics(seatsRes.data.metrics);
      }
    } catch (err) {
      // Polling error silently handled
    }
  };

  // Seat click handler
  const handleSeatClick = (seatNumber, status, lockedByMe) => {
    if (status === "BOOKED") return;
    if (status === "LOCKED" && !lockedByMe) return;

    setConflictMessage("");

    // If seats were previously locked, toggling releases the old lock state
    if (isLockedByMe) {
      setIsLockedByMe(false);
      setExpiresAt(null);
    }

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Temporary Seat Locking (Requirement 16, 17, 18)
  const handleLockSeats = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (selectedSeats.length === 0) {
      setConflictMessage("Please select at least one seat to lock.");
      return;
    }

    setLockLoading(true);
    setConflictMessage("");

    try {
      const res = await API.post("/seats/lock", {
        showId,
        seatIds: selectedSeats,
      });

      if (res.data?.success) {
        setIsLockedByMe(true);
        setExpiresAt(res.data.expiresAt);
        await fetchSeatsOnly();
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Seat Conflict
        setConflictMessage(
          err.response?.data?.message ||
            "One or more selected seats were just taken by another user. Please choose different seats."
        );
        fetchSeatsOnly();
      } else {
        setConflictMessage(err.response?.data?.message || "Failed to lock seats.");
      }
    } finally {
      setLockLoading(false);
    }
  };

  // DSA Recommendation Helper (Requirement 28 & 29)
  const handleDsaRecommend = async (strategy) => {
    setDsaLoading(true);
    setDsaMessage("");
    setConflictMessage("");

    try {
      const res = await API.post("/seats/recommend", {
        showId,
        count: dsaCount,
        strategy,
      });

      const rec = res.data?.recommendation;
      if (rec?.seats && rec.seats.length > 0) {
        setSelectedSeats(rec.seats);
        setIsLockedByMe(false);
        setExpiresAt(null);
        setDsaMessage(`Recommended seats: [${rec.seats.join(", ")}] — ${rec.reason}`);
      } else {
        setDsaMessage(rec?.reason || "Could not find a group of seats matching your request.");
      }
    } catch (err) {
      setDsaMessage("Could not retrieve recommendations at this time.");
    } finally {
      setDsaLoading(false);
    }
  };

  // Confirm Final Booking (Requirement 20, 21, 22)
  const handleConfirmBooking = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (selectedSeats.length === 0) {
      setConflictMessage("Please select seats to complete booking.");
      return;
    }

    setBookingLoading(true);
    setConflictMessage("");

    try {
      // 1. If not locked yet, lock first
      if (!isLockedByMe) {
        const lockRes = await API.post("/seats/lock", {
          showId,
          seatIds: selectedSeats,
        });
        if (!lockRes.data?.success) {
          throw new Error("Could not acquire lock for selected seats.");
        }
      }

      // 2. Complete Booking
      const bookingRes = await API.post("/bookings", {
        showId,
        seats: selectedSeats,
      });

      if (bookingRes.data?.success) {
        const confirmedId = bookingRes.data.booking._id;
        navigate(`/booking/${confirmedId}`);
      }
    } catch (err) {
      setConflictMessage(
        err.response?.data?.message ||
          "Booking could not be completed. Your lock may have expired."
      );
      fetchSeatsOnly();
    } finally {
      setBookingLoading(false);
    }
  };

  // Price Calculations (Immediate preview for frontend)
  const calculatePricing = () => {
    const multiplier = show?.priceMultiplier || 1.0;
    let subtotal = 0;

    selectedSeats.forEach((seatNum) => {
      const seatObj = seats.find((s) => s.seatNumber === seatNum);
      const basePrice = seatObj?.price || (seatNum.charAt(0) >= "E" ? 400 : seatNum.charAt(0) >= "C" ? 250 : 150);
      subtotal += Math.round(basePrice * multiplier);
    });

    const convenienceFee = selectedSeats.length > 0 ? 50 : 0;
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal + convenienceFee + tax;

    return { subtotal, convenienceFee, tax, totalAmount };
  };

  const pricing = calculatePricing();

  // Group seats by row for layout rendering
  const rowsMap = new Map();
  seats.forEach((seat) => {
    if (!rowsMap.has(seat.row)) {
      rowsMap.set(seat.row, []);
    }
    rowsMap.get(seat.row).push(seat);
  });

  const sortedRows = Array.from(rowsMap.keys()).sort();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5 vh-100 d-flex flex-column justify-content-center align-items-center">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-secondary mt-3">Loading interactive seat layout...</p>
        </div>
      </>
    );
  }

  if (error || !show) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="alert alert-danger">{error || "Show not found"}</div>
          <button className="btn btn-outline-light rounded-pill px-4 mt-3" onClick={() => navigate("/events")}>
            &laquo; Back to Events
          </button>
        </div>
      </>
    );
  }

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Navbar />

      <div className="container py-4">
        {/* Header Summary */}
        <div
          className="card border-0 p-4 mb-4 shadow"
          style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge badge-category mb-1">
                {show.eventId?.category || show.movie?.category || "Event"}
              </span>
              <h3 className="fw-bold text-white mb-1">
                {show.eventId?.title || show.movie?.title || "Event Title"}
              </h3>
              <p className="text-secondary small mb-0">
                <i className="bi bi-geo-alt text-danger me-1"></i>
                {show.theatre} |{" "}
                <i className="bi bi-calendar3 text-danger me-1"></i>
                {new Date(show.date).toLocaleDateString()} |{" "}
                <i className="bi bi-clock text-danger me-1"></i>
                {show.startTime || show.showTime}
              </p>
            </div>

            {/* Temporary Lock Active Banner */}
            {isLockedByMe && remainingSeconds > 0 && (
              <div className="lock-timer-box shadow d-flex align-items-center gap-3">
                <div>
                  <span className="badge bg-warning text-dark fw-bold mb-1 d-block">
                    <i className="bi bi-lock-fill me-1"></i> 2-MIN TEMPORARY LOCK ACTIVE
                  </span>
                  <span className="text-white small">
                    Expires in:{" "}
                    <strong className="fs-5 text-warning font-monospace">
                      {formatTimer(remainingSeconds)}
                    </strong>
                  </span>
                </div>
                <div
                  className="spinner-grow text-warning"
                  style={{ width: "1.5rem", height: "1.5rem" }}
                  role="status"
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Error / Conflict Alert Banner */}
        {conflictMessage && (
          <div className="alert alert-danger shadow-sm d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
            <div>
              <strong>Seat Notice: </strong> {conflictMessage}
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Main Seat Layout Area (Left Column) */}
          <div className="col-lg-8">
            <div
              className="card border-0 p-4 shadow text-center"
              style={{ background: "#1a1c24", borderRadius: "16px", minHeight: "520px" }}
            >
              {/* Screen Visualizer (Requirement 15) */}
              <div className="cinema-screen-container">
                <div className="cinema-screen"></div>
                <div className="screen-text">
                  <i className="bi bi-tv me-1"></i> SCREEN / STAGE
                </div>
              </div>

              {/* Legend (Requirement 15) */}
              <div className="d-flex flex-wrap justify-content-center gap-4 mb-4 py-2 border-bottom border-secondary border-opacity-25 small">
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="seat-btn seat-available"
                    style={{ width: "24px", height: "24px", margin: 0 }}
                  ></span>
                  <span className="text-secondary">Available</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span
                    className="seat-btn seat-selected"
                    style={{ width: "24px", height: "24px", margin: 0 }}
                  ></span>
                  <span className="text-secondary">Selected</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span
                    className="seat-btn seat-locked"
                    style={{ width: "24px", height: "24px", margin: 0 }}
                  >
                    🔒
                  </span>
                  <span className="text-secondary">Locked (2 Min)</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span
                    className="seat-btn seat-booked"
                    style={{ width: "24px", height: "24px", margin: 0 }}
                  ></span>
                  <span className="text-secondary">Booked</span>
                </div>
              </div>

              {/* Seat Matrix Grid */}
              <div className="seat-grid-container py-3 overflow-auto">
                {sortedRows.map((rowKey) => {
                  const rowSeats = rowsMap.get(rowKey) || [];
                  rowSeats.sort((a, b) => a.column - b.column);

                  const firstSeat = rowSeats[0];
                  const tierBadge =
                    firstSeat?.type === "VIP"
                      ? "badge-vip"
                      : firstSeat?.type === "PREMIUM"
                      ? "badge-premium"
                      : "badge-regular";

                  return (
                    <div
                      key={rowKey}
                      className="d-flex justify-content-center align-items-center mb-2"
                    >
                      {/* Row Label & Tier Indicator */}
                      <div
                        className="d-flex align-items-center me-3"
                        style={{ width: "70px", textAlign: "right" }}
                      >
                        <span className={`badge ${tierBadge} small me-2`} style={{ fontSize: "10px" }}>
                          {firstSeat?.type || "REG"}
                        </span>
                        <strong className="text-white fs-6">{rowKey}</strong>
                      </div>

                      {/* Seat Buttons in Row */}
                      <div className="d-flex gap-1">
                        {rowSeats.map((seat) => {
                          const isSelected = selectedSeats.includes(seat.seatNumber);
                          const isBooked = seat.status === "BOOKED";
                          const isLocked = seat.status === "LOCKED";
                          const isMyLock = seat.lockedByMe;

                          let seatClass = "seat-available";
                          let title = `${seat.seatNumber} (${seat.type}) - ₹${seat.effectivePrice}`;

                          if (isBooked) {
                            seatClass = "seat-booked";
                            title = `${seat.seatNumber} - Already Booked`;
                          } else if (isSelected) {
                            seatClass = "seat-selected";
                            title = `${seat.seatNumber} - Selected`;
                          } else if (isLocked) {
                            seatClass = "seat-locked";
                            title = `${seat.seatNumber} - Temporarily Locked by another user`;
                          }

                          return (
                            <button
                              key={seat.seatNumber}
                              className={`seat-btn ${seatClass}`}
                              disabled={isBooked || (isLocked && !isMyLock)}
                              onClick={() =>
                                handleSeatClick(seat.seatNumber, seat.status, isMyLock)
                              }
                              title={title}
                            >
                              {isLocked && !isSelected ? "🔒" : seat.column}
                            </button>
                          );
                        })}
                      </div>

                      <div className="ms-3 text-secondary small" style={{ width: "30px" }}>
                        {rowKey}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DSA Seat Recommendation Widget (Requirements 28 & 29) */}
              <div
                className="card border-0 p-3 mt-4 text-start"
                style={{ background: "#252834", borderRadius: "12px" }}
              >
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                  <span className="text-warning fw-semibold small">
                    <i className="bi bi-stars me-1"></i> Smart DSA Seat Recommendation
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <label className="text-secondary small mb-0">Seat Quantity:</label>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary"
                      style={{ width: "70px" }}
                      value={dsaCount}
                      onChange={(e) => setDsaCount(parseInt(e.target.value, 10))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-sm btn-outline-warning rounded-pill"
                    disabled={dsaLoading}
                    onClick={() => handleDsaRecommend("consecutive")}
                  >
                    <i className="bi bi-segmented-nav me-1"></i> Find Consecutive Seats
                  </button>

                  <button
                    className="btn btn-sm btn-outline-info rounded-pill"
                    disabled={dsaLoading}
                    onClick={() => handleDsaRecommend("best")}
                  >
                    <i className="bi bi-gem me-1"></i> Best Seat Recommendation (Center View)
                  </button>
                </div>

                {dsaMessage && (
                  <p className="text-light small mt-2 mb-0 bg-dark p-2 rounded border border-secondary border-opacity-50">
                    <i className="bi bi-info-circle me-1 text-warning"></i>
                    {dsaMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Availability Analytics & Booking Summary */}
          <div className="col-lg-4">
            {/* Real-time Occupancy Analytics Card (Requirement 30) */}
            {metrics && (
              <div
                className="card border-0 p-3 mb-4 shadow"
                style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
              >
                <h6 className="fw-bold text-white mb-3">
                  <i className="bi bi-pie-chart-fill text-danger me-2"></i>
                  Availability & Occupancy
                </h6>

                <div className="row g-2 text-center mb-3">
                  <div className="col-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">Available</span>
                      <strong className="text-primary fs-5">{metrics.availableSeats}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">Booked</span>
                      <strong className="text-danger fs-5">{metrics.bookedSeats}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">Locked</span>
                      <strong className="text-warning fs-5">{metrics.lockedSeats}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">Total Seats</span>
                      <strong className="text-white fs-5">{metrics.totalSeats}</strong>
                    </div>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <span className="text-secondary small d-block mb-1">
                  Venue Occupancy: <strong>{metrics.occupancyPercentage}%</strong>
                </span>
                <div className="progress bg-dark" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{ width: `${metrics.occupancyPercentage}%` }}
                    aria-valuenow={metrics.occupancyPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            )}

            {/* Price Calculation & Checkout Card (Requirements 15, 21, 22) */}
            <div
              className="card border-0 p-4 shadow"
              style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
            >
              <h5 className="fw-bold text-white mb-3 border-bottom border-secondary border-opacity-25 pb-3">
                <i className="bi bi-receipt text-danger me-2"></i>
                Booking Summary
              </h5>

              <div className="mb-3">
                <span className="text-secondary small d-block mb-1">Selected Seats:</span>
                <div className="d-flex flex-wrap gap-1">
                  {selectedSeats.length > 0 ? (
                    selectedSeats.map((seat) => (
                      <span key={seat} className="badge bg-success fs-6 py-2 px-3 rounded-pill">
                        {seat}
                      </span>
                    ))
                  ) : (
                    <span className="text-secondary fst-italic small">No seats selected</span>
                  )}
                </div>
              </div>

              <div className="border-top border-secondary border-opacity-25 pt-3 mb-3">
                <div className="d-flex justify-content-between text-secondary mb-2 small">
                  <span>Number of Seats:</span>
                  <span className="text-white fw-semibold">{selectedSeats.length}</span>
                </div>

                <div className="d-flex justify-content-between text-secondary mb-2 small">
                  <span>Subtotal:</span>
                  <span className="text-white fw-semibold">₹{pricing.subtotal}</span>
                </div>

                <div className="d-flex justify-content-between text-secondary mb-2 small">
                  <span>Convenience Fee:</span>
                  <span className="text-white fw-semibold">₹{pricing.convenienceFee}</span>
                </div>

                <div className="d-flex justify-content-between text-secondary mb-2 small">
                  <span>Taxes (18% GST):</span>
                  <span className="text-white fw-semibold">₹{pricing.tax}</span>
                </div>

                <div className="d-flex justify-content-between text-white fs-5 fw-bold pt-3 border-top border-secondary border-opacity-25">
                  <span>Total Amount:</span>
                  <span className="text-danger">₹{pricing.totalAmount}</span>
                </div>
              </div>

              {/* Action Buttons: Temporary Lock & Proceed */}
              <div className="d-grid gap-2">
                {!isLockedByMe ? (
                  <button
                    className="btn btn-warning py-2 fw-semibold rounded-pill"
                    disabled={selectedSeats.length === 0 || lockLoading}
                    onClick={handleLockSeats}
                  >
                    {lockLoading ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-lock-fill me-1"></i>
                    )}
                    {lockLoading ? "Acquiring Lock..." : "Temporarily Lock Seats (2 Min)"}
                  </button>
                ) : (
                  <div className="badge bg-warning text-dark py-2 rounded-pill small mb-1">
                    <i className="bi bi-check-circle-fill me-1"></i> Seats Locked For You ({formatTimer(remainingSeconds)})
                  </div>
                )}

                <button
                  className="btn btn-danger py-3 fw-bold rounded-pill shadow"
                  disabled={selectedSeats.length === 0 || bookingLoading}
                  onClick={handleConfirmBooking}
                >
                  {bookingLoading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-ticket-perforated-fill me-2"></i>
                  )}
                  {bookingLoading ? "Processing Booking..." : "Confirm & Book Now"}
                </button>
              </div>

              <p className="text-secondary small text-center mt-3 mb-0" style={{ fontSize: "11px" }}>
                🔒 Server verifies seat availability & locks to prevent concurrent double-booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SeatSelection;