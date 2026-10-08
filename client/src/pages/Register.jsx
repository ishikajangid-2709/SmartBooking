import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/register", formData);
      if (res.data?.success) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div
              className="card shadow-lg border-0 p-4"
              style={{
                background: "#1a1c24",
                borderRadius: "20px",
                border: "1px solid #2a2d39",
              }}
            >
              <div className="text-center mb-4">
                <span className="fs-1">🎟️</span>
                <h3 className="fw-bold text-white mt-2">Create Account</h3>
                <p className="text-secondary small">
                  Join the platform to book seats & manage events
                </p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success py-2 small" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label text-light small fw-semibold">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. user@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-light small fw-semibold">
                    Password (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    name="password"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Choose a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-light small fw-semibold">
                    Account Role
                  </label>
                  <select
                    name="role"
                    className="form-select bg-dark text-white border-secondary"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="USER">Standard User (Book tickets)</option>
                    <option value="ADMIN">Administrator (Manage events & dashboard)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-danger w-100 py-2 fw-semibold rounded-pill mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                  ) : (
                    <i className="bi bi-person-plus-fill me-1"></i>
                  )}
                  {loading ? "Creating Account..." : "Register"}
                </button>
              </form>

              <div className="text-center">
                <p className="text-secondary small mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-danger fw-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;