import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path ? "nav-link active fw-semibold" : "nav-link";

  return (
    <header className="bg-light border-bottom">
      <div className="container py-2">
        {/* Row 1: Brand (left) + Logout (right) */}
        <div className="d-flex justify-content-between align-items-center w-100">
          <Link
            className="navbar-brand m-0 fw-bold"
            to="/branches"
            style={{ color: "#7600bc" }}
          >
            SMART INVENTORY
          </Link>

          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Row 2: Links (separate line) */}
      <div className="bg-white border-top">
        <div className="container py-2">
          <nav className="navbar-nav flex-row flex-wrap gap-2 justify-content-center">
            <Link className={isActive("/branches")} to="/branches">
              Branches
            </Link>
            <Link className={isActive("/categories")} to="/categories">
              Categories
            </Link>
            <Link className={isActive("/products")} to="/products">
              Products
            </Link>
            <Link className={isActive("/inventory")} to="/inventory">
              Inventory
            </Link>
            <Link className={isActive("/transfers")} to="/transfers">
              Transfers
            </Link>
            <Link className={isActive("/distributors")} to="/distributors">
              Distributors
            </Link>
            <Link className={isActive("/orders")} to="/orders">
              Orders
            </Link>
            <Link className={isActive("/deliveries")} to="/deliveries">
              Deliveries
            </Link>
            <Link className={isActive("/reports")} to="/reports">
              Reports
            </Link>
            <Link className={isActive("/notifications")} to="/notifications">
              Notifications
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}