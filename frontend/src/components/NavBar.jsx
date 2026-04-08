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
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom">
      <div className="container">
        <Link className="navbar-brand" to="/branches">
          Smart Inventory
        </Link>

        <div className="navbar-nav me-auto">
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
        </div>

        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}