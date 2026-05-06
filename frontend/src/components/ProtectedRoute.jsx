// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

const BRANCH_RESTRICTED_ROLES = ["BRANCH_MANAGER", "BRANCH_STAFF"];

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role") || "";
  const branchIsActive = sessionStorage.getItem("branchIsActive");

  const getDefaultPath = (userRole) => {
    if (userRole === "SUPER_ADMIN") return "/dashboard";
    if (userRole === "BRANCH_MANAGER") return "/dashboard";
    if (userRole === "INVENTORY_OFFICER") return "/dashboard";
    if (userRole === "BRANCH_STAFF") return "/orders";
    if (userRole === "DELIVERY_RIDER") return "/deliveries";
    return "/login";
  };

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (
    BRANCH_RESTRICTED_ROLES.includes(role) &&
    branchIsActive === "false" &&
    location.pathname !== "/branch-inactive"
  ) {
    return <Navigate to="/branch-inactive" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={getDefaultPath(role)} replace />;
    }
  }

  return children;
}