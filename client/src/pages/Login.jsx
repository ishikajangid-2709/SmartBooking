import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data?.success) {
        login(res.data.token, res.data.user);

        // Redirect based on role or intended destination
        const destination =
          location.state?.from?.pathname ||
          (res.data.user.role === "ADMIN" ? "/admin" : "/events");
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
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
                <h3 className="fw-bold text-white mt-2">Welcome Back</h3>
                <p className="text-secondary small">
                  Sign in to manage and book your event tickets
                </p>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label text-light small fw-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="e.g. user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-light small fw-semibold">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                  )}
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
              </form>

              {/* Demo Credentials Helper */}
              <div className="p-3 rounded mb-3" style={{ background: "#252834" }}>
                <p className="small text-warning fw-semibold mb-2">
                  <i className="bi bi-key-fill me-1"></i> Quick Demo Logins:
                </p>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning w-50"
                    onClick={() => fillDemo("user@example.com", "User@123")}
                  >
                    👤 Regular User
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger w-50"
                    onClick={() => fillDemo("admin@example.com", "Admin@123")}
                  >
                    👑 Administrator
                  </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-secondary small mb-0">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-danger fw-semibold">
                    Register Here
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

export default Login;