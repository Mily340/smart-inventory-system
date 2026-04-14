import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function RegistrationRequests() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("PENDING"); // PENDING | APPROVED | REJECTED | ""
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");

  const fetchRequests = async () => {
    setError("");
    setLoading(true);
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await client.get(`/admin/registration-requests${qs}`);
      setRequests(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load requests";
      setError(msg);
      if (msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("fullName");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const approve = async (id) => {
    setError("");
    setActionLoadingId(id);
    try {
      await client.patch(`/admin/registration-requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoadingId("");
    }
  };

  const reject = async (id) => {
    setError("");
    setActionLoadingId(id);
    try {
      await client.patch(`/admin/registration-requests/${id}/reject`, {
        reason: "Rejected by admin",
      });
      fetchRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Registration Requests</h4>

          <div style={{ width: 220 }}>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="">ALL</option>
            </select>
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th style={{ width: 220 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.fullName}</td>
                    <td>{r.email}</td>
                    <td>{r.role}</td>
                    <td>{r.branch?.name || r.branchId || "-"}</td>
                    <td>{r.status}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>
                      {r.status === "PENDING" ? (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-success"
                            disabled={actionLoadingId === r.id}
                            onClick={() => approve(r.id)}
                          >
                            {actionLoadingId === r.id ? "..." : "Approve"}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={actionLoadingId === r.id}
                            onClick={() => reject(r.id)}
                          >
                            {actionLoadingId === r.id ? "..." : "Reject"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No requests found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}