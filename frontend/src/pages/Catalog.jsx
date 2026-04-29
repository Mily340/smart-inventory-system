// frontend/src/pages/Catalog.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const FALLBACK_IMG = "https://via.placeholder.com/500x320?text=Product";
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
  const role = localStorage.getItem("role") || "";

  const dashboardPath =
    role === "DELIVERY_RIDER"
      ? "/deliveries"
      : role === "BRANCH_STAFF"
      ? "/orders"
      : "/dashboard";

  const fetchCatalog = async () => {
    setLoading(true);
    setError("");

    try {
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
      const text = `${p.name || ""} ${p.sku || ""} ${p.description || ""}`.toLowerCase();
      const okQ = query ? text.includes(query) : true;

      return okCat && okQ;
    });
  }, [products, q, categoryId]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    localStorage.removeItem("branchId");
    navigate("/catalog", { replace: true });
  };

  const clearFilters = () => {
    setQ("");
    setCategoryId("");
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #F8FBFF 0%, #F7F4FF 55%, #FFF7FB 100%)",
    padding: "20px 0 36px",
  };

  const shellStyle = {
    maxWidth: 1280,
  };

  const panelStyle = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.32)",
    boxShadow: "0 10px 26px rgba(15,23,42,.06)",
    background: "rgba(255,255,255,.9)",
  };

  const inputStyle = {
    borderRadius: 14,
    minHeight: 40,
  };

  return (
    <div style={pageStyle}>
      <div className="container" style={shellStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div
              style={{
                color: "#7600BC",
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 0.4,
                lineHeight: 1.1,
              }}
            >
              SMART INVENTORY
            </div>

            <div className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
              Public Product Catalog
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {token ? (
              <>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={{ borderRadius: 12, fontWeight: 700, padding: "7px 13px" }}
                  onClick={() => navigate(dashboardPath)}
                >
                  Dashboard
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={{ borderRadius: 12, fontWeight: 700, padding: "7px 13px" }}
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline-secondary btn-sm"
                style={{ borderRadius: 12, fontWeight: 700, padding: "7px 13px" }}
                onClick={() => navigate("/login")}
              >
                Staff Login
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="alert alert-danger" style={{ borderRadius: 14 }}>
            {error}
          </div>
        ) : null}

        <div className="card mb-3" style={panelStyle}>
          <div className="card-body" style={{ padding: 16 }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Find Products
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Search by product name, SKU, or description.
                </div>
              </div>

              <span
                className="text-muted"
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,.35)",
                  background: "rgba(248,250,252,.9)",
                }}
              >
                {loading ? "Loading..." : `Showing ${filtered.length} of ${products.length} products`}
              </span>
            </div>

            <form
              className="row g-2 align-items-end"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <div className="col-12 col-lg-6">
                <input
                  className="form-control"
                  style={inputStyle}
                  placeholder="Search products..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="col-12 col-lg-4">
                <select
                  className="form-select"
                  style={inputStyle}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
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

              <div className="col-6 col-lg-1 d-grid">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ borderRadius: 14, fontWeight: 800, minHeight: 40 }}
                >
                  Search
                </button>
              </div>

              <div className="col-6 col-lg-1 d-grid">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  style={{ borderRadius: 14, fontWeight: 700, minHeight: 40 }}
                  onClick={clearFilters}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Loading catalog...</div>
        ) : (
          <div className="row g-3">
            {filtered.map((p) => (
              <div className="col-12 col-md-6 col-xl-4" key={p.id}>
                <div
                  className="card h-100"
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(148,163,184,.32)",
                    boxShadow: "0 10px 24px rgba(15,23,42,.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: 170,
                      overflow: "hidden",
                      background: "#F8FAFC",
                    }}
                  >
                    <img
                      src={p.imageUrl || FALLBACK_IMG}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_IMG) {
                          e.currentTarget.src = FALLBACK_IMG;
                        }
                      }}
                    />
                  </div>

                  <div className="card-body text-center" style={{ padding: "14px 16px 10px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span
                        style={{
                          padding: "5px 9px",
                          borderRadius: 999,
                          background: "#F8FAFC",
                          color: "#111827",
                          border: "1px solid #E5E7EB",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {p.category?.name || "Category"}
                      </span>

                      <span className="text-muted" style={{ fontWeight: 700 }}>
                        {p.code || ""}
                      </span>
                    </div>

                    <h5
                      className="mb-1"
                      style={{
                        fontWeight: 900,
                        color: "#111827",
                        fontSize: 20,
                      }}
                    >
                      {p.name}
                    </h5>

                    <div className="text-muted mb-1" style={{ fontSize: 14 }}>
                      SKU: {p.sku || "-"}
                    </div>

                    <div
                      className="mb-1"
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        color: "#4F46E5",
                      }}
                    >
                      {money(p.price)}
                    </div>

                    <div
                      className="text-muted"
                      style={{
                        minHeight: 22,
                        fontSize: 13,
                      }}
                    >
                      {p.description || "No description available."}
                    </div>
                  </div>

                  <div className="card-footer bg-white border-0 pt-0 pb-2 px-3">
                    <button
                      className="btn btn-outline-primary w-100"
                      style={{ borderRadius: 12, fontWeight: 800, padding: "7px 10px" }}
                      onClick={() => navigate(`/catalog/${p.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="col-12">
                <div
                  className="text-center text-muted p-4"
                  style={{
                    borderRadius: 18,
                    border: "1px dashed rgba(148,163,184,.5)",
                    background: "rgba(255,255,255,.75)",
                  }}
                >
                  No products found.
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}