import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const money = (n) => `৳${Number(n || 0).toLocaleString()}`;

export default function Catalog() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchCatalog = async () => {
    setLoading(true);
    setError("");
    try {
      // Public endpoints
      const [pRes, cRes] = await Promise.all([
        client.get("/public/products"),
        client.get("/public/categories"),
      ]);

      setProducts(pRes.data?.data || []);
      setCategories(cRes.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (products || []).filter((p) => {
      const okCat = categoryId ? p.categoryId === categoryId : true;
      const okQ = query
        ? `${p.name || ""} ${p.sku || ""} ${p.description || ""}`.toLowerCase().includes(query)
        : true;
      return okCat && okQ;
    });
  }, [products, q, categoryId]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    navigate("/catalog", { replace: true });
  };

  return (
    <div className="container" style={{ marginTop: 30, marginBottom: 50 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <div className="fw-bold" style={{ color: "#7600bc", fontSize: 28 }}>
            SMART INVENTORY
          </div>
          <div className="text-muted">Public Product Catalog</div>
        </div>

        <div className="d-flex gap-2">
          {token ? (
            <>
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate("/branches")}
              >
                Dashboard
              </button>
              <button className="btn btn-outline-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/login")}
            >
              Staff Login
            </button>
          )}
          {/* Registration removed (no Register Request button) */}
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <form
            className="row g-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="col-md-6">
              <input
                className="form-control"
                placeholder="Search products (name, SKU, description)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code ? `${c.code} - ` : ""}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <button type="button" className="btn btn-primary w-100" onClick={() => {}}>
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="row g-3">
          {filtered.map((p) => (
            <div className="col-12 col-md-6 col-lg-4" key={p.id}>
              <div className="card h-100">
                {/* image */}
                <div
                  style={{
                    height: 220,
                    overflow: "hidden",
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                    background: "#f6f7f9",
                  }}
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                  ) : null}
                </div>

                <div className="card-body text-center">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-dark">
                      {p.category?.name || "Category"}
                    </span>
                    <span className="text-muted">{p.code || ""}</span>
                  </div>

                  <h5 className="mb-1">{p.name}</h5>
                  <div className="text-muted mb-2">SKU: {p.sku || "-"}</div>

                  <div className="fw-semibold mb-2">Price: {money(p.price)}</div>

                  <div className="text-muted" style={{ minHeight: 22 }}>
                    {p.description || "No description"}
                  </div>
                </div>

                <div className="card-footer bg-white border-0 pb-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => navigate(`/catalog/${p.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="text-center text-muted">No products found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}