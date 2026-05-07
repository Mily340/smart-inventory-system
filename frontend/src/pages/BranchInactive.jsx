// frontend/src/pages/BranchInactive.jsx
import { useNavigate } from "react-router-dom";

const roleLabel = (role) => {
  const labels = {
    SUPER_ADMIN: "System Administrator",
    INVENTORY_OFFICER: "Inventory Officer",
    BRANCH_MANAGER: "Branch Manager",
    BRANCH_STAFF: "Branch Staff",
    DELIVERY_RIDER: "Delivery Rider",
  };

  return labels[role] || role || "—";
};

export default function BranchInactive() {
  const navigate = useNavigate();

  const role = sessionStorage.getItem("role") || "";
  const branchName = sessionStorage.getItem("branchName") || "your assigned branch";

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("branchId");
    sessionStorage.removeItem("branchName");
    sessionStorage.removeItem("branchIsActive");
    sessionStorage.removeItem("si_sidebar_scrollTop");

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    localStorage.removeItem("branchId");
    localStorage.removeItem("branchName");
    localStorage.removeItem("branchIsActive");

    navigate("/login", { replace: true });
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(239,246,255,1), rgba(255,255,255,1), rgba(254,242,242,.65))",
        padding: 20,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 560,
          width: "100%",
          borderRadius: 22,
          border: "1px solid rgba(148,163,184,.35)",
          boxShadow: "0 18px 45px rgba(15,23,42,.12)",
          overflow: "hidden",
        }}
      >
        <div
          className="card-body text-center"
          style={{
            padding: "38px 30px",
          }}
        >
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: 30,
            }}
          >
            <i className="bi bi-slash-circle"></i>
          </div>

          <h3 style={{ fontWeight: 900, color: "#0F172A" }}>Branch Inactive</h3>

          <p className="text-muted mb-2" style={{ fontSize: 16 }}>
            Your branch is inactive or deactivated for now.
          </p>

          <p className="text-muted mb-4" style={{ fontSize: 15 }}>
            Please contact the respective authority.
          </p>

          <div
            className="mb-4 mx-auto text-start"
            style={{
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,.35)",
              background: "#F8FAFC",
              padding: 14,
              maxWidth: 380,
            }}
          >
            <div className="small text-muted">Assigned Branch</div>
            <div style={{ fontWeight: 800, color: "#0F172A" }}>{branchName}</div>

            <div className="small text-muted mt-2">User Role</div>
            <div style={{ fontWeight: 800, color: "#0F172A" }}>{roleLabel(role)}</div>
          </div>

          <button
            className="btn btn-primary"
            style={{
              borderRadius: 12,
              fontWeight: 800,
              padding: "10px 22px",
            }}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}