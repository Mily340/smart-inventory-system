import { Link, useLocation, useNavigate } from "react-router-dom";

export default function NavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "";

  const isRider = role === "DELIVERY_RIDER";
  const isStaff = ["SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"].includes(role);
  const isSuperAdmin = role === "SUPER_ADMIN";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path ? "nav-link active fw-semibold" : "nav-link";

  const brandLink = isRider ? "/deliveries" : "/branches";

  return (
    <header className="bg-light border-bottom">
      <div className="container py-2">
        <div className="d-flex justify-content-between align-items-center w-100">
          <Link
            className="navbar-brand m-0 fw-bold"
            to={brandLink}
            style={{ color: "#7600bc" }}
          >
            SMART INVENTORY
          </Link>

          <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white border-top">
        <div className="container py-2">
          <nav className="navbar-nav flex-row flex-wrap gap-2 justify-content-center">
            {/* Public catalog link (everyone logged in can view) */}
            <Link className={isActive("/catalog")} to="/catalog">
              Catalog
            </Link>

            {/* Staff */}
            {isStaff ? (
              <>
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
                <Link className={isActive("/branch-stock")} to="/branch-stock">
                  Branch Stock
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

                {/* SUPER_ADMIN only */}
                {isSuperAdmin ? (
                  <>
                    <Link
                      className={isActive("/admin/registration-requests")}
                      to="/admin/registration-requests"
                    >
                      User Approvals
                    </Link>

                    <Link className={isActive("/admin/users")} to="/admin/users">
                      Users
                    </Link>
                  </>
                ) : null}
              </>
            ) : null}

            {/* Rider */}
            {isRider ? (
              <Link className={isActive("/deliveries")} to="/deliveries">
                Deliveries
              </Link>
            ) : null}

            {/* Everyone (logged in) */}
            <Link className={isActive("/notifications")} to="/notifications">
              Notifications
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}