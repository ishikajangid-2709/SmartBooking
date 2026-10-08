import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Movie",
    language: "English",
    duration: 120,
    poster: "",
    rating: 4.5,
    releaseDate: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    basePrice: 150,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/events?limit=100");
      if (res.data?.success) {
        setEvents(res.data.events || []);
      }
    } catch (err) {
      setError("Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      title: "",
      description: "",
      category: "Movie",
      language: "English",
      duration: 120,
      poster: "",
      rating: 4.5,
      releaseDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      basePrice: 150,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (evt) => {
    setIsEditing(true);
    setCurrentId(evt._id);
    setFormData({
      title: evt.title,
      description: evt.description,
      category: evt.category || "Movie",
      language: evt.language || "English",
      duration: evt.duration || 120,
      poster: evt.poster || "",
      rating: evt.rating || 4.5,
      releaseDate: evt.releaseDate ? evt.releaseDate.split("T")[0] : "",
      status: evt.status || "ACTIVE",
      basePrice: evt.basePrice || 150,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        await API.put(`/events/${currentId}`, formData);
        alert("Event updated successfully!");
      } else {
        await API.post("/events", formData);
        alert("Event created successfully!");
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete event "${title}"?`)) return;

    try {
      const res = await API.delete(`/events/${id}`);
      if (res.data?.success) {
        alert("Event deleted successfully!");
        fetchEvents();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-film text-danger me-2"></i> Event Management
            </h2>
            <p className="text-secondary small mb-0">
              Create, update, and manage scheduled movies, concerts, sports, and theatre shows.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
              &laquo; Back to Dashboard
            </Link>
            <button className="btn btn-danger rounded-pill px-4 fw-semibold" onClick={handleOpenCreate}>
              <i className="bi bi-plus-circle me-1"></i> Add New Event
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading events directory...</p>
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
                    <th scope="col">Category</th>
                    <th scope="col">Language</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Base Price</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-secondary">
                        No events found in the database.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt) => (
                      <tr key={evt._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={evt.poster}
                              alt={evt.title}
                              className="rounded"
                              style={{ width: "45px", height: "60px", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60";
                              }}
                            />
                            <div>
                              <strong className="text-white d-block">{evt.title}</strong>
                              <span className="text-secondary small">{evt.duration} mins</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-category">{evt.category}</span>
                        </td>
                        <td className="text-secondary small">{evt.language}</td>
                        <td className="text-warning small fw-bold">★ {evt.rating?.toFixed(1) || "4.5"}</td>
                        <td className="text-white fw-bold">₹{evt.basePrice || 150}</td>
                        <td>
                          <span
                            className={`badge ${
                              evt.status === "ACTIVE"
                                ? "bg-success"
                                : evt.status === "COMPLETED"
                                ? "bg-secondary"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-outline-info rounded-pill px-3 me-2"
                            onClick={() => handleOpenEdit(evt)}
                          >
                            <i className="bi bi-pencil me-1"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                            onClick={() => handleDelete(evt._id, evt.title)}
                          >
                            <i className="bi bi-trash me-1"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Event Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div
                className="modal-content text-white p-3"
                style={{ background: "#1a1c24", borderRadius: "20px", border: "1px solid #363a4d" }}
              >
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-white">
                    {isEditing ? "✏️ Edit Event" : "➕ Create New Event"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-8">
                        <label className="form-label small text-secondary">Event Title *</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-secondary">Category *</label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                          <option value="Movie">Movie</option>
                          <option value="Concert">Concert</option>
                          <option value="Sports">Sports</option>
                          <option value="Theatre">Theatre</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Conference">Conference</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small text-secondary">Description *</label>
                        <textarea
                          rows="3"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          required
                        ></textarea>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-secondary">Language *</label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-secondary">Duration (Minutes) *</label>
                        <input
                          type="number"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-secondary">Base Price (₹) *</label>
                        <input
                          type="number"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="col-md-8">
                        <label className="form-label small text-secondary">Poster Image URL</label>
                        <input
                          type="url"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="https://..."
                          value={formData.poster}
                          onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small text-secondary">Status</label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
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
                      {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
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

export default AdminEvents;
