import React, { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await API.get("/admin/users");
      if (res.data?.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      setError("Failed to fetch user directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus, name) => {
    const action = currentStatus === "ACTIVE" ? "suspend / block" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} user "${name}"?`)) return;

    try {
      const res = await API.put(`/admin/users/${id}/status`);
      if (res.data?.success) {
        alert(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-white mb-1">
              <i className="bi bi-people text-danger me-2"></i> User Directory
            </h2>
            <p className="text-secondary small mb-0">
              Inspect user registrations, role delegations, and account operational status.
            </p>
          </div>

          <Link to="/admin" className="btn btn-outline-secondary rounded-pill px-3">
            &laquo; Dashboard
          </Link>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-secondary mt-2">Loading user accounts...</p>
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
                    <th scope="col" className="ps-4">User</th>
                    <th scope="col">Email Address</th>
                    <th scope="col">Role</th>
                    <th scope="col">Registration Date</th>
                    <th scope="col">Account Status</th>
                    <th scope="col" className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-secondary">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isAdm = u.role === "ADMIN" || u.role === "admin";
                      const isActive = u.status !== "BLOCKED";

                      return (
                        <tr key={u._id}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center gap-2">
                              <span className="p-2 rounded-circle bg-secondary bg-opacity-25 text-white">
                                <i className="bi bi-person"></i>
                              </span>
                              <strong className="text-white">{u.name}</strong>
                            </div>
                          </td>
                          <td className="text-secondary small font-monospace">{u.email}</td>
                          <td>
                            <span
                              className={`badge ${
                                isAdm ? "bg-danger" : "bg-primary"
                              }`}
                            >
                              {u.role?.toUpperCase() || "USER"}
                            </span>
                          </td>
                          <td className="text-secondary small">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isActive ? "bg-success" : "bg-danger"
                              }`}
                            >
                              {u.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="text-end pe-4">
                            <button
                              className={`btn btn-sm rounded-pill px-3 ${
                                isActive
                                  ? "btn-outline-danger"
                                  : "btn-outline-success"
                              }`}
                              onClick={() => handleToggleStatus(u._id, u.status, u.name)}
                            >
                              {isActive ? "Block Access" : "Activate User"}
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
      </div>
    </>
  );
}

export default AdminUsers;
