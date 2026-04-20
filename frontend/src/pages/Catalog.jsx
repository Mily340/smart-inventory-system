import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

const FALLBACK_IMG = "https://via.placeholder.com/600x400?text=Product";

export default function Catalog() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    const res = await client.get("/public/categories");
    setCategories(res.data?.data || []);
  };

  const loadProducts = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (categoryId) params.set("categoryId", categoryId);

      const res = await client.get(
        `/public/products${params.toString() ? `?${params}` : ""}`
      );
      setProducts(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadCategories();
        await loadProducts();
      } catch {
        setError("Failed to load catalog");
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const onCategoryChange = async (val) => {
    setCategoryId(val);
    setTimeout(loadProducts, 0);
  };

  return (
    <div className="container" style={{ marginTop: 28 }}>
      {/* Public Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Link to="/catalog" className="text-decoration-none">
          <div style={{ fontWeight: 800, color: "#7600bc", fontSize: 22 }}>
            SMART INVENTORY
          </div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            Public Product Catalog
          </div>
        </Link>

        <div className="d-flex gap-2">
          <Link to="/register" className="btn btn-outline-secondary btn-sm">
            Register Request
          </Link>
          <Link to="/login" className="btn btn-outline-secondary btn-sm">
            Staff Login
          </Link>
        </div>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {/* Search */}
      <div className="card mb-3">
        <div className="card-body">
          <form className="row g-2" onSubmit={onSearch}>
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
                onChange={(e) => onCategoryChange(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <button className="btn btn-primary w-100">Search</button>
            </div>
          </form>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="row g-3">
          {products.map((p) => (
            <div className="col-md-4" key={p.id}>
              <div className="card h-100">
                {/* Image (bigger) */}
                <img
                  src={p.imageUrl || FALLBACK_IMG}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="img-fluid"
                  style={{
                    height: 240, // ✅ bigger image area
                    width: "100%",
                    objectFit: "cover",
                    background: "#f2f2f2",
                  }}
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_IMG) {
                      e.currentTarget.src = FALLBACK_IMG;
                    }
                  }}
                />

                {/* Details (smaller + tighter) */}
                <div className="card-body py-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <span
                      className="badge bg-light text-dark"
                      style={{ fontSize: 12 }}
                    >
                      {p.category?.name || "Uncategorized"}
                    </span>
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {p.code || "-"}
                    </span>
                  </div>

                  <h6 className="mt-2 mb-1" style={{ fontSize: 16 }}>
                    {p.name}
                  </h6>

                  <div
                    className="text-muted"
                    style={{ fontSize: 12, marginBottom: 6 }}
                  >
                    SKU: {p.sku}
                  </div>

                  <div
                    className="fw-semibold"
                    style={{ fontSize: 14, marginBottom: 6 }}
                  >
                    Price: ৳{p.price}
                  </div>

                  <div className="text-muted" style={{ fontSize: 12, minHeight: 28 }}>
                    {p.description ? p.description.slice(0, 70) : "No description"}
                    {p.description && p.description.length > 70 ? "..." : ""}
                  </div>
                </div>

                <div className="card-footer bg-white border-0 pt-0">
                  <Link
                    className="btn btn-outline-primary btn-sm w-100"
                    to={`/catalog/${p.id}`}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 ? (
            <div className="col-12">
              <div className="text-center text-muted">No products found</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}