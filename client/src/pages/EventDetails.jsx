import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEventAndShows();
  }, [id]);

  const fetchEventAndShows = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch Event details
      const eventRes = await API.get(`/events/${id}`);
      setEvent(eventRes.data.event || eventRes.data.movie);

      // Fetch Shows for this event
      const showsRes = await API.get(`/shows/${id}`);
      setShows(showsRes.data.shows || []);
    } catch (err) {
      setError("Failed to load event details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-5 vh-100 d-flex flex-column justify-content-center align-items-center">
          <div className="spinner-border text-danger" role="status"></div>
          <p className="text-secondary mt-3">Loading event details...</p>
        </div>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center">
          <div className="alert alert-danger" role="alert">
            {error || "Event not found"}
          </div>
          <button className="btn btn-outline-light rounded-pill px-4 mt-3" onClick={() => navigate("/events")}>
            &laquo; Back to Events
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Backdrop & Header Banner */}
      <div
        className="position-relative py-5 text-white"
        style={{
          background: "linear-gradient(180deg, #1f222e 0%, #0f1015 100%)",
          borderBottom: "1px solid #2a2d39",
        }}
      >
        <div className="container py-4">
          <div className="row g-5 align-items-center">
            {/* Poster */}
            <div className="col-md-4 text-center">
              <img
                src={event.poster}
                alt={event.title}
                className="img-fluid rounded-4 shadow-lg"
                style={{
                  maxHeight: "480px",
                  width: "100%",
                  objectFit: "cover",
                  border: "1px solid #3b3f4f",
                }}
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60";
                }}
              />
            </div>

            {/* Event Info */}
            <div className="col-md-8">
              <div className="d-flex flex-wrap gap-2 mb-3">
                <span className="badge badge-category fs-6">{event.category}</span>
                <span className="badge bg-dark border border-secondary text-warning fs-6">
                  ★ {event.rating?.toFixed(1) || "4.5"} / 5.0
                </span>
                <span className="badge bg-secondary fs-6">{event.status}</span>
              </div>

              <h1 className="display-5 fw-bold mb-3">{event.title}</h1>

              <div className="d-flex flex-wrap gap-4 text-secondary mb-4 fs-6">
                <span>
                  <i className="bi bi-translate text-danger me-1"></i>
                  <strong>Language:</strong> {event.language}
                </span>
                <span>
                  <i className="bi bi-clock-history text-danger me-1"></i>
                  <strong>Duration:</strong> {event.duration} Minutes
                </span>
                <span>
                  <i className="bi bi-calendar3 text-danger me-1"></i>
                  <strong>Release Date:</strong>{" "}
                  {new Date(event.releaseDate).toLocaleDateString()}
                </span>
              </div>

              <div className="mb-4">
                <h5 className="fw-bold text-white mb-2">About the Event</h5>
                <p className="text-secondary leading-relaxed" style={{ fontSize: "16px" }}>
                  {event.description}
                </p>
              </div>

              <div className="p-3 rounded-3" style={{ background: "#1a1c24", border: "1px solid #2a2d39", maxWidth: "450px" }}>
                <span className="text-secondary small d-block">Base Ticket Pricing</span>
                <span className="fs-4 fw-bold text-white">₹{event.basePrice || 150}</span>
                <span className="text-secondary small ms-2">(Subject to seat tier & multiplier)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shows Section */}
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-white mb-1">
              <i className="bi bi-ticket-detailed text-danger me-2"></i> Available Shows
            </h3>
            <p className="text-secondary small mb-0">
              Select a theatre show to view the real-time seat layout and reserve seats.
            </p>
          </div>
        </div>

        {shows.length === 0 ? (
          <div
            className="text-center py-5 rounded-4"
            style={{ background: "#1a1c24", border: "1px dashed #3a3e4e" }}
          >
            <span className="fs-1">🕒</span>
            <h5 className="text-white mt-3">No Scheduled Shows Currently</h5>
            <p className="text-secondary mb-3">
              Check back soon or explore other exciting events.
            </p>
            <button
              className="btn btn-outline-light rounded-pill px-4"
              onClick={() => navigate("/events")}
            >
              Browse Other Events
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {shows.map((show) => (
              <div key={show._id} className="col-md-6 col-lg-4">
                <div
                  className="card border-0 shadow-sm h-100 p-4"
                  style={{
                    background: "#1a1c24",
                    borderRadius: "16px",
                    border: "1px solid #2a2d39",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1 rounded-pill">
                      {show.status}
                    </span>
                    <span className="badge bg-dark text-warning border border-secondary">
                      Multiplier: {show.priceMultiplier}x
                    </span>
                  </div>

                  <h5 className="fw-bold text-white mb-2">
                    <i className="bi bi-building text-danger me-2"></i>
                    {show.theatre || show.venueId?.name || "Main Venue"}
                  </h5>

                  <p className="text-secondary small mb-3">
                    <i className="bi bi-geo-alt me-1 text-danger"></i>
                    {show.venueId?.city
                      ? `${show.venueId.name}, ${show.venueId.city}`
                      : "Grand Cinema Hall"}
                  </p>

                  <div className="p-3 rounded-3 mb-4" style={{ background: "#252834" }}>
                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-secondary">Date:</span>
                      <span className="text-white fw-semibold">
                        {new Date(show.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between mb-2 small">
                      <span className="text-secondary">Show Time:</span>
                      <span className="text-white fw-semibold">
                        {show.startTime || show.showTime}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between small">
                      <span className="text-secondary">Booked Seats:</span>
                      <span className="text-white fw-semibold">
                        {show.bookedSeats?.length || 0} / {show.totalSeats || 40}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-danger w-100 py-2 rounded-pill fw-semibold mt-auto"
                    onClick={() => navigate(`/seats/${show._id}`)}
                  >
                    Select Seats &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default EventDetails;
