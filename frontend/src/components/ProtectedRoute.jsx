import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "";

  const defaultPath = role === "DELIVERY_RIDER" ? "/deliveries" : "/branches";

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return <Navigate to={defaultPath} replace />;
    }
  }

  return children;
}