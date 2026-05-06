// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const BRANCH_RESTRICTED_ROLES = ["BRANCH_MANAGER", "BRANCH_STAFF"];

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123@");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectByRole = (role, branchIsActive) => {
    if (BRANCH_RESTRICTED_ROLES.includes(role) && branchIsActive === false) {
      return "/branch-inactive";
    }

    if (role === "SUPER_ADMIN") return "/dashboard";
    if (role === "BRANCH_MANAGER") return "/dashboard";
    if (role === "INVENTORY_OFFICER") return "/dashboard";
    if (role === "DELIVERY_RIDER") return "/deliveries";
    if (role === "BRANCH_STAFF") return "/orders";

    return "/dashboard";
  };

  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(window.atob(base64));
    } catch {
      return {};
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await client.post("/auth/login", { email, password });

      const data = res.data?.data || {};
      const token = data.token;

      if (!token) {
        throw new Error("Token not found in response");
      }

      const tokenPayload = decodeJwtPayload(token);
      const user = data.user || data;

      const role = user?.role || tokenPayload?.role || "";
      const fullName = user?.fullName || tokenPayload?.fullName || "";
      const branchId = user?.branchId || tokenPayload?.branchId || "";
      const branchName = user?.branch?.name || tokenPayload?.branchName || "";

      const branchIsActive =
        typeof user?.branchIsActive === "boolean"
          ? user.branchIsActive
          : typeof user?.branch?.isActive === "boolean"
          ? user.branch.isActive
          : typeof tokenPayload?.branchIsActive === "boolean"
          ? tokenPayload.branchIsActive
          : true;

      if (!role) {
        throw new Error("User role not found after login");
      }

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", role);
      sessionStorage.setItem("fullName", fullName);
      sessionStorage.setItem("branchId", branchId || "");
      sessionStorage.setItem("branchName", branchName || "");
      sessionStorage.setItem("branchIsActive", String(branchIsActive));

      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
      localStorage.removeItem("branchId");
      localStorage.removeItem("branchName");
      localStorage.removeItem("branchIsActive");

      navigate(redirectByRole(role, branchIsActive), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Login</h4>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate("/catalog")}
        >
          Catalog
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">
            Email
          </label>

          <input
            id="email"
            name="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="password">
            Password
          </label>

          <div className="input-group">
            <input
              id="password"
              name="password"
              className="form-control"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <button
              type="button"
              className="btn btn-outline-secondary"
              onMouseEnter={() => setShowPassword(true)}
              onMouseLeave={() => setShowPassword(false)}
              onMouseDown={(e) => {
                e.preventDefault();
                setShowPassword(true);
              }}
              onMouseUp={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
              aria-label="Hold to show password"
              title="Hold to show password"
            >
              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"} />
            </button>
          </div>
        </div>

        <button className="btn btn-primary w-100" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}