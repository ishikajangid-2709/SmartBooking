import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function AdminVenues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    rows: 5,
    columns: 8,
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/venues");
      if (res.data?.success) {
        setVenues(res.data.venues || []);
      }
    } catch (err) {
      setError("Failed to fetch venues.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      city: "",
      address: "",
      rows: 5,
      columns: 8,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await API.post("/venues", formData);
      alert("Venue and interactive seat layout created successfully!");
      setShowModal(false);
      fetchVenues();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create venue.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete venue "${name}" and all its seats?`)) return;

    try {
      const res = await API.delete(`/venues/${id}`);
      if (res.data?.success) {
        alert("Venue deleted successfully!");
        fetchVenues();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete venue.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-building text-danger me-2"></i> Venue Management
            </h2>
            <p className="text-secondary small mb-0">
              Configure auditoriums, stadium complexes, opera houses, and automated seat matrices.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
              &laquo; Dashboard
            </Link>
            <button className="btn btn-danger rounded-pill px-4 fw-semibold" onClick={handleOpenCreate}>
              <i className="bi bi-plus-circle me-1"></i> Add New Venue
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading venues...</p>
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
                    <th scope="col" className="ps-4">Venue Name</th>
                    <th scope="col">City</th>
                    <th scope="col">Physical Address</th>
                    <th scope="col">Seat Grid</th>
                    <th scope="col">Total Seats</th>
                    <th scope="col" className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-secondary">
                        No venues registered yet.
                      </td>
                    </tr>
                  ) : (
                    venues.map((venue) => (
                      <tr key={venue._id}>
                        <td className="ps-4 fw-bold text-white">
                          <i className="bi bi-building-fill text-danger me-2"></i>
                          {venue.name}
                        </td>
                        <td>
                          <span className="badge bg-secondary">{venue.city}</span>
                        </td>
                        <td className="text-secondary small">{venue.address}</td>
                        <td className="text-light small">
                          {venue.rows || 5} Rows × {venue.columns || 8} Cols
                        </td>
                        <td>
                          <span className="badge bg-primary fs-6">{venue.totalSeats || 40} Seats</span>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                            onClick={() => handleDelete(venue._id, venue.name)}
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

        {/* Create Venue Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content text-white p-3"
                style={{ background: "#1a1c24", borderRadius: "20px", border: "1px solid #363a4d" }}
              >
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-white">🏢 Add New Venue</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small text-secondary">Venue Name *</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. IMAX Symphony Arena"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small text-secondary">City *</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small text-secondary">Address *</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. Phoenix Mall, Kurla"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small text-secondary">Rows (A, B, C...)</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.rows}
                          onChange={(e) =>
                            setFormData({ ...formData, rows: parseInt(e.target.value, 10) || 5 })
                          }
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-secondary">Columns (1, 2, 3...)</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          className="form-control bg-dark text-white border-secondary"
                          value={formData.columns}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              columns: parseInt(e.target.value, 10) || 8,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded bg-dark border border-secondary border-opacity-25 small text-secondary">
                      ℹ️ System will automatically generate{" "}
                      <strong className="text-white">
                        {formData.rows * formData.columns} seats
                      </strong>{" "}
                      with VIP, Premium, and Regular tiers.
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
                      {submitting ? "Generating..." : "Create Venue & Seats"}
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

export default AdminVenues;
