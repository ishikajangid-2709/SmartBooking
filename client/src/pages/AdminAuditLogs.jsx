import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

const AUDIT_ACTIONS = [
  "All",
  "USER_REGISTERED",
  "USER_LOGIN",
  "EVENT_CREATED",
  "EVENT_UPDATED",
  "EVENT_DELETED",
  "SHOW_CREATED",
  "BOOKING_CREATED",
  "BOOKING_CANCELLED",
  "SEAT_LOCKED",
  "DATABASE_SEEDED",
];

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");

    try {
      const params = { limit: 100 };
      if (selectedAction !== "All") params.action = selectedAction;

      const res = await API.get("/admin/audit-logs", { params });
      if (res.data?.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      setError("Failed to fetch audit log entries.");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeClass = (action) => {
    if (action.includes("DELETE") || action.includes("CANCEL")) return "bg-danger";
    if (action.includes("CREATE") || action.includes("REGISTER")) return "bg-success";
    if (action.includes("LOCK")) return "bg-warning text-dark";
    if (action.includes("LOGIN")) return "bg-info text-dark";
    return "bg-secondary";
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-journal-text text-warning me-2"></i> System Audit Logs
            </h2>
            <p className="text-secondary small mb-0">
              Immutable chronological record of authentication, inventory modifications, seat locking, and bookings.
            </p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
              &laquo; Dashboard
            </Link>

            <select
              className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill px-3"
              style={{ width: "200px" }}
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              {AUDIT_ACTIONS.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
            <p className="text-secondary mt-2">Loading system audit records...</p>
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
                    <th scope="col" className="ps-4">Timestamp</th>
                    <th scope="col">Action</th>
                    <th scope="col">Description</th>
                    <th scope="col" className="pe-4">Initiated By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-secondary">
                        No audit log entries found for this action.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td className="ps-4 text-secondary small font-monospace">
                          {new Date(log.timestamp || log.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="text-light small">{log.description}</td>
                        <td className="pe-4 text-secondary small">
                          {log.userId ? (
                            <span>
                              <i className="bi bi-person me-1"></i>
                              {log.userId.name || log.userId.email || "User"}
                            </span>
                          ) : (
                            <span className="text-muted fst-italic">System Daemon</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminAuditLogs;
