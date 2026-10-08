import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, token, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/events">
          <span className="fs-3 me-2">🎟️</span>
          <span style={{ letterSpacing: "0.5px" }}>
            <span className="text-danger">Smart</span>Booking
          </span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <Link
                to="/events"
                className={`nav-link px-3 ${isActive("/events") || isActive("/") ? "active text-white fw-semibold" : ""}`}
              >
                <i className="bi bi-calendar-event me-1"></i> Browse Events
              </Link>
            </li>

            {token && (
              <li className="nav-item">
                <Link
                  to="/my-bookings"
                  className={`nav-link px-3 ${isActive("/my-bookings") ? "active text-warning fw-semibold" : ""}`}
                >
                  <i className="bi bi-ticket-perforated me-1"></i> My Bookings
                </Link>
              </li>
            )}

            {isAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle text-danger fw-semibold px-3"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-shield-lock me-1"></i> Admin Console
                </a>
                <ul className="dropdown-menu dropdown-menu-dark shadow-lg">
                  <li>
                    <Link className="dropdown-item" to="/admin">
                      <i className="bi bi-speedometer2 me-2"></i> Dashboard Overview
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" to="/admin/events">
                      <i className="bi bi-film me-2"></i> Manage Events
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/venues">
                      <i className="bi bi-building me-2"></i> Manage Venues
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/shows">
                      <i className="bi bi-clock-history me-2"></i> Manage Shows
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/bookings">
                      <i className="bi bi-receipt me-2"></i> View All Bookings
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/users">
                      <i className="bi bi-people me-2"></i> User Directory
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/audit-logs">
                      <i className="bi bi-journal-text me-2"></i> System Audit Logs
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {token ? (
              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-secondary p-2 d-flex align-items-center gap-1">
                  <i className="bi bi-person-circle"></i>
                  <span>{user?.name || "User"}</span>
                  <span className={`badge ms-1 ${isAdmin ? "bg-danger" : "bg-primary"}`}>
                    {user?.role || "USER"}
                  </span>
                </span>
                <button
                  className="btn btn-outline-danger btn-sm px-3 rounded-pill"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i> Logout
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm px-3 rounded-pill">
                  Login
                </Link>
                <Link to="/register" className="btn btn-danger btn-sm px-3 rounded-pill">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;