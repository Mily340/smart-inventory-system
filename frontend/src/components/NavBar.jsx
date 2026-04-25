import { useEffect, useLayoutEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NavBar.css";

const SIDEBAR_SCROLL_KEY = "si_sidebar_scrollTop";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "";

  const isLoggedIn = !!token;
  const isRider = role === "DELIVERY_RIDER";
  const isBranchStaff = role === "BRANCH_STAFF";
  const isAdminStaff = ["SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"].includes(role);
  const isSuperAdmin = role === "SUPER_ADMIN";

  // Don't show dashboard shell on public pages
  const isPublicCatalog = location.pathname.startsWith("/catalog");
  const isLoginPage = location.pathname === "/login";
  const shouldShowShell = isLoggedIn && !isPublicCatalog && !isLoginPage;

  // Apply layout class to body
  useEffect(() => {
    if (shouldShowShell) document.body.classList.add("si-layout");
    else document.body.classList.remove("si-layout");
    return () => document.body.classList.remove("si-layout");
  }, [shouldShowShell]);

  // Restore sidebar scroll on navigation (prevents jumping to top)
  useLayoutEffect(() => {
    if (!shouldShowShell) return;
    const el = sidebarRef.current;
    if (!el) return;

    const saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (saved != null) {
      const n = Number(saved);
      if (Number.isFinite(n)) el.scrollTop = n;
    }
  }, [location.pathname, shouldShowShell]);

  // Save sidebar scroll continuously
  useEffect(() => {
    if (!shouldShowShell) return;
    const el = sidebarRef.current;
    if (!el) return;

    const onScroll = () => {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(el.scrollTop));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [shouldShowShell]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    sessionStorage.removeItem(SIDEBAR_SCROLL_KEY);
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const brandLink = isRider ? "/deliveries" : isBranchStaff ? "/orders" : "/dashboard";

  if (!shouldShowShell) return null;

  return (
    <>
      {/* Top bar */}
      <header className="si-topbar">
        <div className="si-topbar-inner">
          <div className="si-topbar-right">
            <span className="si-role-pill">Role: {role || "—"}</span>
            <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="si-sidebar" ref={sidebarRef}>
        <Link to={brandLink} className="si-brand">
          <div className="si-brand-title">SMART INVENTORY</div>
          <div className="si-brand-sub">Admin Dashboard</div>
        </Link>

        <nav className="si-nav">
          <Link className={`si-link ${isActive("/dashboard") ? "active" : ""}`} to="/dashboard">
            Dashboard
          </Link>

          {isAdminStaff ? (
            <>
              <div className="si-nav-section">Management</div>

              <Link className={`si-link ${isActive("/branches") ? "active" : ""}`} to="/branches">
                Branches
              </Link>
              <Link className={`si-link ${isActive("/categories") ? "active" : ""}`} to="/categories">
                Categories
              </Link>
              <Link className={`si-link ${isActive("/products") ? "active" : ""}`} to="/products">
                Products
              </Link>
              <Link className={`si-link ${isActive("/inventory") ? "active" : ""}`} to="/inventory">
                Inventory
              </Link>
              <Link className={`si-link ${isActive("/branch-stock") ? "active" : ""}`} to="/branch-stock">
                Branch Stock
              </Link>

              <div className="si-nav-section">Operations</div>

              <Link className={`si-link ${isActive("/transfers") ? "active" : ""}`} to="/transfers">
                Transfers
              </Link>
              <Link className={`si-link ${isActive("/distributors") ? "active" : ""}`} to="/distributors">
                Distributors
              </Link>
              <Link className={`si-link ${isActive("/orders") ? "active" : ""}`} to="/orders">
                Orders
              </Link>
              <Link className={`si-link ${isActive("/deliveries") ? "active" : ""}`} to="/deliveries">
                Deliveries
              </Link>
              <Link className={`si-link ${isActive("/reports") ? "active" : ""}`} to="/reports">
                Reports
              </Link>

              {isSuperAdmin ? (
                <>
                  <div className="si-nav-section">Admin</div>
                  <Link className={`si-link ${isActive("/admin/users") ? "active" : ""}`} to="/admin/users">
                    Users
                  </Link>
                </>
              ) : null}
            </>
          ) : null}

          {isBranchStaff ? (
            <>
              <div className="si-nav-section">Branch</div>
              <Link className={`si-link ${isActive("/branch-stock") ? "active" : ""}`} to="/branch-stock">
                Branch Stock
              </Link>
              <Link className={`si-link ${isActive("/orders") ? "active" : ""}`} to="/orders">
                Orders
              </Link>
            </>
          ) : null}

          {isRider ? (
            <>
              <div className="si-nav-section">Delivery</div>
              <Link className={`si-link ${isActive("/deliveries") ? "active" : ""}`} to="/deliveries">
                Deliveries
              </Link>
            </>
          ) : null}

          <div className="si-nav-section">System</div>
          <Link className={`si-link ${isActive("/notifications") ? "active" : ""}`} to="/notifications">
            Notifications
          </Link>

          <Link className="si-link si-link-muted" to="/catalog">
            Public Catalog
          </Link>
        </nav>
      </aside>
    </>
  );
}