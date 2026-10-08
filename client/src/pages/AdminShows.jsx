import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function AdminShows() {
  const [shows, setShows] = useState([]);
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    eventId: "",
    venueId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "18:00",
    priceMultiplier: 1.0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [showsRes, eventsRes, venuesRes] = await Promise.all([
        API.get("/shows"),
        API.get("/events?limit=100"),
        API.get("/venues"),
      ]);

      if (showsRes.data?.success) setShows(showsRes.data.shows || []);
      if (eventsRes.data?.success) setEvents(eventsRes.data.events || []);
      if (venuesRes.data?.success) setVenues(venuesRes.data.venues || []);
    } catch (err) {
      setError("Failed to fetch show schedules.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      eventId: events[0]?._id || "",
      venueId: venues[0]?._id || "",
      date: new Date().toISOString().split("T")[0],
      startTime: "18:00",
      priceMultiplier: 1.0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.eventId || !formData.venueId) {
      alert("Please select both an event and a venue.");
      return;
    }

    setSubmitting(true);
    try {
      await API.post("/shows", formData);
      alert("Show scheduled successfully!");
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to schedule show.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this show?")) return;

    try {
      const res = await API.delete(`/shows/${id}`);
      if (res.data?.success) {
        alert("Show deleted successfully!");
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete show.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-clock-history text-danger me-2"></i> Show Management
            </h2>
            <p className="text-secondary small mb-0">
              Schedule live screenings, concert slots, and venue showtimes.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
              &laquo; Dashboard
            </Link>
            <button className="btn btn-danger rounded-pill px-4 fw-semibold" onClick={handleOpenCreate}>
              <i className="bi bi-plus-circle me-1"></i> Schedule New Show
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading shows...</p>
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
                    <th scope="col" className="ps-4">Event</th>
                    <th scope="col">Venue</th>
                    <th scope="col">Date & Time</th>
                    <th scope="col">Multiplier</th>
                    <th scope="col">Booked Seats</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-secondary">
                        No shows scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    shows.map((show) => {
                      const event = show.eventId || show.movie;
                      const venue = show.venueId;

                      return (
                        <tr key={show._id}>
                          <td className="ps-4">
                            <strong className="text-white d-block">
                              {event?.title || "Event Title"}
                            </strong>
                            <span className="badge badge-category small">
                              {event?.category || "Event"}
                            </span>
                          </td>
                          <td>
                            <div className="text-light">
                              <i className="bi bi-building me-1 text-danger"></i>
                              {show.theatre || venue?.name || "Main Screen"}
                            </div>
                            <span className="text-secondary small">{venue?.city}</span>
                          </td>
                          <td>
                            <div className="text-white fw-semibold">
                              {new Date(show.date).toLocaleDateString()}
                            </div>
                            <span className="text-secondary small">
                              {show.startTime || show.showTime}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-dark border border-secondary text-warning">
                              {show.priceMultiplier}x
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {show.bookedSeats?.length || 0} / {show.totalSeats || 40}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                show.status === "ACTIVE" ? "bg-success" : "bg-secondary"
                              }`}
                            >
                              {show.status}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <Link
                              to={`/seats/${show._id}`}
                              className="btn btn-sm btn-outline-info rounded-pill px-3 me-2"
                            >
                              <i className="bi bi-eye me-1"></i> Seat Map
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill px-3"
                              onClick={() => handleDelete(show._id)}
                            >
                              <i className="bi bi-trash me-1"></i> Delete
                            </button>
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

        {/* Schedule Show Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content text-white p-3"
                style={{ background: "#1a1c24", borderRadius: "20px", border: "1px solid #363a4d" }}
              >
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-white">🕒 Schedule New Show</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small text-secondary">Select Event *</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={formData.eventId}
                        onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                        required
                      >
                        {events.map((evt) => (
                          <option key={evt._id} value={evt._id}>
                            {evt.title} ({evt.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small text-secondary">Select Venue *</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={formData.venueId}
                        onChange={(e) => setFormData({ ...formData, venueId: e.target.value })}
                        required
                      >
                        {venues.map((venue) => (
                          <option key={venue._id} value={venue._id}>
                            {venue.name} ({venue.city}) - {venue.totalSeats} seats
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small text-secondary">Date *</label>
                        <input
                          type="date"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-secondary">Start Time *</label>
                        <input
                          type="time"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small text-secondary">Price Multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="3.0"
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.priceMultiplier}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            priceMultiplier: parseFloat(e.target.value) || 1.0,
                          })
                        }
                      />
                      <small className="text-secondary">
                        Standard = 1.0x (e.g. Weekend prime-time = 1.2x)
                      </small>
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger rounded-pill px-4 fw-semibold"
                      disabled={submitting}
                    >
                      {submitting ? "Scheduling..." : "Save Show"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminShows;
