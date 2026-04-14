import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function RegisterRequest() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("BRANCH_MANAGER");
  const [branchId, setBranchId] = useState("");

  useEffect(() => {
    client
      .get("/branches/public")
      .then((res) => {
        const b = res.data?.data || [];
        setBranches(b);
        if (b.length > 0) setBranchId(b[0].id);
      })
      .catch(() => {
        setBranches([]);
      });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      await client.post("/register-request", {
        fullName,
        email,
        password,
        role,
        branchId,
      });

      setMsg("Registration request submitted. Wait for admin approval.");
      setFullName("");
      setEmail("");
      setPassword("");
      // keep role/branch
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520, marginTop: 60 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Register Request</h4>
        <Link to="/login" className="btn btn-outline-secondary btn-sm">
          Back to Login
        </Link>
      </div>

      {msg ? <div className="alert alert-success">{msg}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={submit} className="card">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="form-text">Password will be stored securely (hashed).</div>
          </div>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
                <option value="INVENTORY_OFFICER">INVENTORY_OFFICER</option>
                <option value="DELIVERY_RIDER">DELIVERY_RIDER</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Branch</label>
              <select
                className="form-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
              >
                {branches.length === 0 ? (
                  <option value="">No branches available</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <button className="btn btn-primary w-100 mt-3" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}