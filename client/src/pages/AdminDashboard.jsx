import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [statsRes, analyticsRes] = await Promise.all([
        API.get("/admin/dashboard"),
        API.get("/admin/analytics"),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.analytics);
    } catch (err) {
      setError("Failed to load dashboard metrics. Check admin permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        {/* Dashboard Title & Admin Navigation Pill Bar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <span className="badge bg-danger px-3 py-2 rounded-pill small mb-2">
              <i className="bi bi-shield-lock-fill me-1"></i> ADMIN CONSOLE
            </span>
            <h2 className="fw-bold text-white mb-1">Executive Operations Dashboard</h2>
            <p className="text-secondary small mb-0">
              Real-time platform telemetry, revenue analytics, inventory management, and audit logs.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Link to="/admin/events" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-film me-1"></i> Events
            </Link>
            <Link to="/admin/venues" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-building me-1"></i> Venues
            </Link>
            <Link to="/admin/shows" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-clock me-1"></i> Shows
            </Link>
            <Link to="/admin/bookings" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-receipt me-1"></i> Bookings
            </Link>
            <Link to="/admin/users" className="btn btn-outline-light btn-sm rounded-pill px-3">
              <i className="bi bi-people me-1"></i> Users
            </Link>
            <Link to="/admin/audit-logs" className="btn btn-outline-warning btn-sm rounded-pill px-3">
              <i className="bi bi-journal-text me-1"></i> Audit Logs
            </Link>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading executive metrics...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && stats && (
          <>
            {/* Metric Summary Cards (Requirement 31) */}
            <div className="row g-3 mb-5">
              {/* Total Revenue */}
              <div className="col-sm-6 col-lg-3">
                <div
                  className="card border-0 p-3 h-100 shadow"
                  style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold">Total Revenue</span>
                    <span className="p-2 bg-success bg-opacity-25 rounded-circle text-success fs-5">
                      <i className="bi bi-currency-rupee"></i>
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-0">₹{stats.totalRevenue?.toLocaleString()}</h3>
                  <span className="text-success small mt-2 d-block">
                    <i className="bi bi-check-circle-fill me-1"></i> Confirmed bookings
                  </span>
                </div>
              </div>

              {/* Total Bookings */}
              <div className="col-sm-6 col-lg-3">
                <div
                  className="card border-0 p-3 h-100 shadow"
                  style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold">Total Bookings</span>
                    <span className="p-2 bg-primary bg-opacity-25 rounded-circle text-primary fs-5">
                      <i className="bi bi-ticket-detailed-fill"></i>
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-0">{stats.totalBookings}</h3>
                  <span className="text-secondary small mt-2 d-block">
                    Confirmed: <strong>{stats.confirmedBookings}</strong> | Cancelled:{" "}
                    <strong>{stats.cancelledBookings}</strong>
                  </span>
                </div>
              </div>

              {/* Total Users */}
              <div className="col-sm-6 col-lg-3">
                <div
                  className="card border-0 p-3 h-100 shadow"
                  style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold">Registered Users</span>
                    <span className="p-2 bg-info bg-opacity-25 rounded-circle text-info fs-5">
                      <i className="bi bi-people-fill"></i>
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-0">{stats.totalUsers}</h3>
                  <span className="text-secondary small mt-2 d-block">
                    Active member accounts
                  </span>
                </div>
              </div>

              {/* Total Events & Venues */}
              <div className="col-sm-6 col-lg-3">
                <div
                  className="card border-0 p-3 h-100 shadow"
                  style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-secondary small fw-semibold">Events & Venues</span>
                    <span className="p-2 bg-warning bg-opacity-25 rounded-circle text-warning fs-5">
                      <i className="bi bi-film"></i>
                    </span>
                  </div>
                  <h3 className="fw-bold text-white mb-0">
                    {stats.totalEvents} <span className="fs-6 text-secondary fw-normal">Events</span>
                  </h3>
                  <span className="text-secondary small mt-2 d-block">
                    {stats.totalVenues} Venues | {stats.totalShows} Scheduled Shows
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics Section (Requirement 32) */}
            {analytics && (
              <div className="row g-4 mb-5">
                {/* Revenue Periods */}
                <div className="col-lg-4">
                  <div
                    className="card border-0 p-4 shadow h-100"
                    style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                  >
                    <h5 className="fw-bold text-white mb-3">
                      <i className="bi bi-cash-stack text-success me-2"></i> Revenue Breakdown
                    </h5>

                    <div className="p-3 rounded-3 mb-3 bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">Today's Revenue</span>
                      <h4 className="fw-bold text-success mb-0">
                        ₹{analytics.revenue?.today?.toLocaleString() || 0}
                      </h4>
                    </div>

                    <div className="p-3 rounded-3 mb-3 bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">This Week's Revenue</span>
                      <h4 className="fw-bold text-white mb-0">
                        ₹{analytics.revenue?.thisWeek?.toLocaleString() || 0}
                      </h4>
                    </div>

                    <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                      <span className="text-secondary small d-block">This Month's Revenue</span>
                      <h4 className="fw-bold text-warning mb-0">
                        ₹{analytics.revenue?.thisMonth?.toLocaleString() || 0}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Seat Occupancy Analytics */}
                <div className="col-lg-4">
                  <div
                    className="card border-0 p-4 shadow h-100"
                    style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                  >
                    <h5 className="fw-bold text-white mb-3">
                      <i className="bi bi-pie-chart-fill text-danger me-2"></i> Seat Occupancy
                    </h5>

                    <div className="text-center mb-4">
                      <h2 className="display-5 fw-bold text-danger mb-0">
                        {analytics.occupancy?.rate}%
                      </h2>
                      <span className="text-secondary small">System-Wide Occupancy Rate</span>
                    </div>

                    <div className="row g-2 text-center small mb-3">
                      <div className="col-4">
                        <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                          <span className="text-secondary d-block">Booked</span>
                          <strong className="text-danger fs-6">
                            {analytics.occupancy?.bookedSeats}
                          </strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                          <span className="text-secondary d-block">Locked</span>
                          <strong className="text-warning fs-6">
                            {analytics.occupancy?.lockedSeats}
                          </strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded bg-dark border border-secondary border-opacity-25">
                          <span className="text-secondary d-block">Available</span>
                          <strong className="text-primary fs-6">
                            {analytics.occupancy?.availableSeats}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="progress bg-dark" style={{ height: "10px" }}>
                      <div
                        className="progress-bar bg-danger"
                        style={{ width: `${analytics.occupancy?.rate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Popular Events */}
                <div className="col-lg-4">
                  <div
                    className="card border-0 p-4 shadow h-100"
                    style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
                  >
                    <h5 className="fw-bold text-white mb-3">
                      <i className="bi bi-trophy-fill text-warning me-2"></i> Top Performing Events
                    </h5>

                    {analytics.popularEvents?.length === 0 ? (
                      <p className="text-secondary small">No booking transactions recorded yet.</p>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {analytics.popularEvents?.map((evt, idx) => (
                          <div
                            key={evt._id || idx}
                            className="d-flex align-items-center justify-content-between p-2 rounded bg-dark border border-secondary border-opacity-25"
                          >
                            <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                              <span className="badge bg-secondary">{idx + 1}</span>
                              <span className="text-white small fw-semibold text-truncate">
                                {evt.title || "Event"}
                              </span>
                            </div>
                            <div className="text-end text-nowrap">
                              <span className="badge bg-danger rounded-pill">
                                {evt.bookingsCount} Bookings
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Daily Trends Chart Visualization */}
            {analytics?.bookingTrends && (
              <div
                className="card border-0 p-4 shadow mb-5"
                style={{ background: "#1a1c24", borderRadius: "16px", border: "1px solid #2a2d39" }}
              >
                <h5 className="fw-bold text-white mb-4">
                  <i className="bi bi-graph-up-arrow text-danger me-2"></i> Booking Trends (Last 7 Days)
                </h5>

                {analytics.bookingTrends.length === 0 ? (
                  <p className="text-secondary small">No bookings within the last 7 days.</p>
                ) : (
                  <div className="d-flex align-items-end gap-3 justify-content-around pt-4" style={{ height: "200px" }}>
                    {analytics.bookingTrends.map((trend) => {
                      const maxVal = Math.max(
                        ...analytics.bookingTrends.map((t) => t.count),
                        1
                      );
                      const heightPercent = Math.max(15, (trend.count / maxVal) * 100);

                      return (
                        <div key={trend._id} className="text-center d-flex flex-column align-items-center" style={{ width: "60px" }}>
                          <span className="text-white small fw-bold mb-1">{trend.count}</span>
                          <div
                            className="w-100 rounded-top bg-danger shadow"
                            style={{
                              height: `${heightPercent}%`,
                              transition: "height 0.4s ease",
                            }}
                          ></div>
                          <span className="text-secondary small mt-2 font-monospace" style={{ fontSize: "11px" }}>
                            {trend._id.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default AdminDashboard;