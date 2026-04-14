import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

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

      const res = await client.get(`/public/products${params.toString() ? `?${params}` : ""}`);
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
    // reload with new filter
    setTimeout(loadProducts, 0);
  };

  return (
    <div className="container" style={{ marginTop: 40 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Product Catalog</h4>
        <Link to="/login" className="btn btn-outline-secondary btn-sm">
          Staff Login
        </Link>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

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
                    {c.code ? `${c.code} - ` : ""}
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

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="row g-3">
          {products.map((p) => (
            <div className="col-md-4" key={p.id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <span className="badge bg-light text-dark">
                      {p.category?.name || "Uncategorized"}
                    </span>
                    <span className="text-muted">{p.code || "-"}</span>
                  </div>

                  <h6 className="mt-2 mb-1">{p.name}</h6>
                  <div className="text-muted small mb-2">SKU: {p.sku}</div>

                  <div className="fw-semibold mb-2">Price: {p.price}</div>

                  <div className="small text-muted" style={{ minHeight: 36 }}>
                    {p.description ? p.description.slice(0, 80) : "No description"}
                    {p.description && p.description.length > 80 ? "..." : ""}
                  </div>
                </div>

                <div className="card-footer bg-white border-0">
                  <Link className="btn btn-outline-primary btn-sm w-100" to={`/catalog/${p.id}`}>
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