import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";

const ROLE_OPTIONS = [
  { value: "BRANCH_MANAGER", label: "Branch Manager" },
  { value: "INVENTORY_OFFICER", label: "Inventory Officer" },
  { value: "BRANCH_STAFF", label: "Branch Staff" },
  { value: "DELIVERY_RIDER", label: "Delivery Rider" },
];

export default function RegisterRequest() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [role, setRole] = useState("BRANCH_STAFF");
  const [branchId, setBranchId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const passwordsMatch = password === confirmPassword;

  const loadBranches = async () => {
    setError("");
    setLoadingBranches(true);
    try {
      // public endpoint (no token needed)
      const res = await client.get("/branches/public");
      const list = res.data?.data || [];
      setBranches(list);
      if (!branchId && list.length > 0) setBranchId(list[0].id);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load branches");
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!branchId) {
      setError("Please select a branch");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await client.post("/register-request", {
        fullName,
        email,
        password,
        role,
        branchId,
      });

      setOkMsg("Registration request submitted. Please wait for admin approval.");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("BRANCH_STAFF");
      // keep branch selected
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const holdToShowHandlers = (setFn, valueWhenHold) => ({
    onMouseEnter: () => setFn(valueWhenHold),
    onMouseLeave: () => setFn(false),
    onMouseDown: (e) => {
      e.preventDefault();
      setFn(valueWhenHold);
    },
    onMouseUp: () => setFn(false),
    onTouchStart: () => setFn(valueWhenHold),
    onTouchEnd: () => setFn(false),
  });

  return (
    <div className="container" style={{ maxWidth: 520, marginTop: 50 }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="m-0">Register Request</h4>
        <Link className="btn btn-outline-secondary btn-sm" to="/catalog">
          Back to Catalog
        </Link>
      </div>

      <div className="text-muted mb-3" style={{ fontSize: 13 }}>
        Submit a request for staff access. Admin will approve/reject.
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}
      {okMsg ? <div className="alert alert-success">{okMsg}</div> : null}

      <form onSubmit={onSubmit} className="card">
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
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="row g-2">
            <div className="col-md-6">
              <label className="form-label">Password</label>

              <div className="input-group">
                <input
                  className="form-control"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  {...holdToShowHandlers(setShowPassword, true)}
                  aria-label="Hold to show password"
                  title="Hold to show password"
                >
                  <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
                </button>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label">Confirm Password</label>

              <div className="input-group">
                <input
                  className={`form-control ${
                    confirmPassword && !passwordsMatch ? "is-invalid" : ""
                  }`}
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  {...holdToShowHandlers(setShowConfirm, true)}
                  aria-label="Hold to show password"
                  title="Hold to show password"
                >
                  <i className={showConfirm ? "bi bi-eye-slash" : "bi bi-eye"} />
                </button>

                {confirmPassword && !passwordsMatch ? (
                  <div className="invalid-feedback">Passwords do not match</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="row g-2 mt-2">
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Branch</label>
              <select
                className="form-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={loadingBranches}
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code ? `${b.code} - ` : ""}
                    {b.name}
                  </option>
                ))}
              </select>

              {loadingBranches ? (
                <div className="form-text">Loading branches...</div>
              ) : null}
            </div>
          </div>

          <button
            className="btn btn-primary w-100 mt-3"
            disabled={loading || !passwordsMatch}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-2"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </form>
    </div>
  );
}