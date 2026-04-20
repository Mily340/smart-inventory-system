import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import client from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123@");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectByRole = (role) => {
    if (role === "DELIVERY_RIDER") return "/deliveries";
    if (role === "BRANCH_STAFF") return "/orders"; // or "/branch-stock"
    return "/branches"; // admin/manager/inventory
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await client.post("/auth/login", { email, password });

      const token = res.data?.data?.token;
      const user = res.data?.data?.user;

      if (!token) throw new Error("Token not found in response");

      localStorage.setItem("token", token);
      if (user?.role) localStorage.setItem("role", user.role);
      if (user?.fullName) localStorage.setItem("fullName", user.fullName);

      navigate(redirectByRole(user?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 80 }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="m-0">Login</h4>
        <Link className="btn btn-outline-secondary btn-sm" to="/catalog">
          Catalog
        </Link>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>

          <div className="input-group">
            <input
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

        <Link className="btn btn-outline-secondary w-100 mt-2" to="/register">
          Register Request
        </Link>
      </form>
    </div>
  );
}