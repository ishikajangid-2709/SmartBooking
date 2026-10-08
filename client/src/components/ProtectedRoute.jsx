import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (role) {
    const requiredRole = role.toUpperCase();
    const userRole = (user?.role || "").toUpperCase();

    if (userRole !== requiredRole) {
      // Forbidden
      return <Navigate to="/events" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
