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

  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role") || "";

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

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("branchId");
    sessionStorage.removeItem("branchName");
    sessionStorage.removeItem("branchIsActive");
    navigate("/catalog", { replace: true });
  };

  const clearFilters = () => {
    setQ("");
    setCategoryId("");
  };

  const pageStyle = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(191,219,254,.55), transparent 26%), radial-gradient(circle at top right, rgba(221,214,254,.50), transparent 28%), linear-gradient(180deg, #F8FBFF 0%, #F7F4FF 55%, #FFF7FB 100%)",
    padding: "14px 0 32px",
  };

  const shellStyle = {
    maxWidth: 1280,
  };

  const navButtonStyle = {
    borderRadius: 12,
    fontWeight: 800,
    padding: "7px 12px",
  };

  const compactHeaderStyle = {
    borderRadius: 22,
    border: "1px solid rgba(148,163,184,.30)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,.92), rgba(239,246,255,.82), rgba(245,243,255,.78))",
    boxShadow: "0 12px 28px rgba(15,23,42,.06)",
    padding: "16px 18px",
    position: "relative",
    overflow: "hidden",
  };

  const panelStyle = {
    borderRadius: 20,
    border: "1px solid rgba(148,163,184,.28)",
    boxShadow: "0 10px 24px rgba(15,23,42,.05)",
    background: "rgba(255,255,255,.90)",
    backdropFilter: "blur(10px)",
  };

  const inputStyle = {
    borderRadius: 14,
    minHeight: 42,
    border: "1px solid rgba(148,163,184,.35)",
    background: "rgba(255,255,255,.92)",
  };

  return (
    <div style={pageStyle}>
      <style>
        {`
          @keyframes catalogFadeUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .catalog-fade-up {
            animation: catalogFadeUp .45s ease both;
          }

          .catalog-product-card {
            border-radius: 22px;
            border: 1px solid rgba(148,163,184,.30);
            background: rgba(255,255,255,.94);
            box-shadow: 0 12px 28px rgba(15,23,42,.07);
            overflow: hidden;
            transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
          }

          .catalog-product-card:hover {
            transform: translateY(-7px);
            box-shadow: 0 20px 42px rgba(15,23,42,.12);
            border-color: rgba(96,165,250,.55);
          }

          .catalog-image-wrap {
            height: 198px;
            overflow: hidden;
            background: #F8FAFC;
            position: relative;
          }

          .catalog-image-wrap img {
            transition: transform .35s ease;
          }

          .catalog-product-card:hover .catalog-image-wrap img {
            transform: scale(1.07);
          }

          .catalog-chip {
            border: 1px solid rgba(148,163,184,.35);
            background: rgba(255,255,255,.86);
            color: #334155;
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 800;
            transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
          }

          .catalog-chip:hover {
            transform: translateY(-2px);
            border-color: rgba(79,70,229,.45);
            color: #4F46E5;
          }

          .catalog-chip.active {
            background: linear-gradient(135deg, #4F46E5, #7C3AED);
            color: #FFFFFF;
            border-color: transparent;
            box-shadow: 0 8px 15px rgba(79,70,229,.18);
          }

          .catalog-mini-stat {
            border-radius: 14px;
            border: 1px solid rgba(148,163,184,.24);
            background: rgba(255,255,255,.74);
            padding: 9px 11px;
            min-width: 96px;
            text-align: center;
          }

          .catalog-skeleton {
            border-radius: 22px;
            min-height: 380px;
            background: linear-gradient(90deg, rgba(255,255,255,.72), rgba(226,232,240,.45), rgba(255,255,255,.72));
            background-size: 200% 100%;
            animation: skeletonMove 1.1s ease-in-out infinite;
            border: 1px solid rgba(148,163,184,.22);
          }

          @keyframes skeletonMove {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          @media (max-width: 575px) {
            .catalog-image-wrap {
              height: 180px;
            }
          }
        `}
      </style>

      <div className="container" style={shellStyle}>
        {/* Compact Top Navigation */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <div
              style={{
                color: "#6D28D9",
                fontSize: 24,
                fontWeight: 950,
                letterSpacing: 0.2,
                lineHeight: 1.1,
              }}
            >
              SMART INVENTORY
            </div>

            <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
              Public Product Catalog
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-outline-primary btn-sm"
              style={navButtonStyle}
              onClick={() => navigate("/")}
            >
              <i className="bi bi-house-door me-1"></i>
              Home
            </button>

            {token ? (
              <>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={navButtonStyle}
                  onClick={() => navigate(dashboardPath)}
                >
                  <i className="bi bi-speedometer2 me-1"></i>
                  Dashboard
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={navButtonStyle}
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="btn btn-outline-secondary btn-sm"
                style={navButtonStyle}
                onClick={() => navigate("/login")}
              >
                Staff Login
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="alert alert-danger mb-2" style={{ borderRadius: 14 }}>
            {error}
          </div>
        ) : null}

        {/* Compact Catalog Header + Filters */}
        <section className="mb-3 catalog-fade-up" style={compactHeaderStyle}>
          <div
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(191,219,254,.42)",
              right: -70,
              top: -85,
              pointerEvents: "none",
            }}
          ></div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="row g-3 align-items-center mb-3">
              <div className="col-12 col-lg-7">
                <div
                  className="d-inline-flex align-items-center gap-2 mb-2"
                  style={{
                    borderRadius: 999,
                    padding: "5px 10px",
                    background: "rgba(238,242,255,.90)",
                    border: "1px solid rgba(165,180,252,.65)",
                    color: "#4F46E5",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  <i className="bi bi-bag-check"></i>
                  Public Catalog
                </div>

                <h1
                  style={{
                    fontSize: "clamp(24px, 3vw, 36px)",
                    fontWeight: 950,
                    letterSpacing: -0.7,
                    lineHeight: 1.08,
                    marginBottom: 6,
                    color: "#0F172A",
                  }}
                >
                  Browse products quickly
                </h1>

                <p className="text-muted mb-0" style={{ fontSize: 13, lineHeight: 1.45 }}>
                  Search by name, SKU, description, or category.
                </p>
              </div>

              <div className="col-12 col-lg-5">
                <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                  <div className="catalog-mini-stat">
                    <div style={{ fontSize: 18, fontWeight: 950, color: "#0F172A" }}>
                      {products.length}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, fontWeight: 800 }}>
                      Products
                    </div>
                  </div>

                  <div className="catalog-mini-stat">
                    <div style={{ fontSize: 18, fontWeight: 950, color: "#0F172A" }}>
                      {categories.length}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, fontWeight: 800 }}>
                      Categories
                    </div>
                  </div>

                  <div className="catalog-mini-stat">
                    <div style={{ fontSize: 18, fontWeight: 950, color: "#4F46E5" }}>
                      {filtered.length}
                    </div>
                    <div className="text-muted" style={{ fontSize: 11, fontWeight: 800 }}>
                      Showing
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={panelStyle}>
              <div className="card-body" style={{ padding: 12 }}>
                <div className="row g-2 align-items-center">
                  <div className="col-12 col-lg-7">
                    <div className="input-group">
                      <span
                        className="input-group-text"
                        style={{
                          borderRadius: "14px 0 0 14px",
                          background: "rgba(255,255,255,.92)",
                          border: "1px solid rgba(148,163,184,.35)",
                          borderRight: 0,
                        }}
                      >
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        className="form-control"
                        style={{
                          ...inputStyle,
                          borderRadius: "0 14px 14px 0",
                          borderLeft: 0,
                        }}
                        placeholder="Search products..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-12 col-lg-3">
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

                  <div className="col-12 col-lg-2 d-grid">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ borderRadius: 14, fontWeight: 800, minHeight: 42 }}
                      onClick={clearFilters}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    className={`catalog-chip ${categoryId === "" ? "active" : ""}`}
                    onClick={() => setCategoryId("")}
                  >
                    All
                  </button>

                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`catalog-chip ${categoryId === c.id ? "active" : ""}`}
                      onClick={() => setCategoryId(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="text-muted mt-2" style={{ fontSize: 12, fontWeight: 700 }}>
                  {loading
                    ? "Loading..."
                    : selectedCategory
                    ? `${filtered.length} product(s) in ${selectedCategory.name}`
                    : `Showing ${filtered.length} of ${products.length} products`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        {loading ? (
          <div className="row g-3">
            {[1, 2, 3, 4, 5, 6].map((x) => (
              <div className="col-12 col-md-6 col-xl-4" key={x}>
                <div className="catalog-skeleton"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="row g-3">
            {filtered.map((p, index) => (
              <div className="col-12 col-md-6 col-xl-4 catalog-fade-up" key={p.id}>
                <div
                  className="card h-100 catalog-product-card"
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.28)}s` }}
                >
                  <div className="catalog-image-wrap">
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

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(15,23,42,0) 42%, rgba(15,23,42,.38) 100%)",
                        pointerEvents: "none",
                      }}
                    ></div>

                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,.88)",
                        color: "#0F172A",
                        border: "1px solid rgba(255,255,255,.72)",
                        fontSize: 12,
                        fontWeight: 900,
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      {p.category?.name || "Category"}
                    </span>

                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(79,70,229,.92)",
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 900,
                        boxShadow: "0 8px 16px rgba(79,70,229,.22)",
                      }}
                    >
                      {p.code || "Product"}
                    </span>
                  </div>

                  <div className="card-body text-center" style={{ padding: "15px 18px 11px" }}>
                    <h5
                      className="mb-1"
                      style={{
                        fontWeight: 950,
                        color: "#111827",
                        fontSize: 20,
                        lineHeight: 1.2,
                      }}
                    >
                      {p.name}
                    </h5>

                    <div className="text-muted mb-2" style={{ fontSize: 13, fontWeight: 700 }}>
                      SKU: {p.sku || "-"}
                    </div>

                    <div
                      className="mb-2"
                      style={{
                        fontSize: 19,
                        fontWeight: 950,
                        color: "#4F46E5",
                      }}
                    >
                      {money(p.price)}
                    </div>

                    <div
                      className="text-muted mx-auto"
                      style={{
                        minHeight: 40,
                        fontSize: 13,
                        lineHeight: 1.5,
                        maxWidth: 330,
                      }}
                    >
                      {p.description || "No description available."}
                    </div>
                  </div>

                  <div className="card-footer bg-white border-0 pt-0 pb-3 px-3">
                    <button
                      className="btn btn-primary w-100"
                      style={{
                        borderRadius: 15,
                        fontWeight: 900,
                        padding: "9px 12px",
                        boxShadow: "0 10px 18px rgba(79,70,229,.18)",
                      }}
                      onClick={() => navigate(`/catalog/${p.id}`)}
                    >
                      View Details
                      <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="col-12">
                <div
                  className="text-center text-muted p-5"
                  style={{
                    borderRadius: 22,
                    border: "1px dashed rgba(148,163,184,.5)",
                    background: "rgba(255,255,255,.78)",
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "#EEF2FF",
                      color: "#4F46E5",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      marginBottom: 12,
                    }}
                  >
                    <i className="bi bi-search"></i>
                  </div>

                  <div style={{ fontWeight: 900, color: "#0F172A", fontSize: 18 }}>
                    No products found
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Try clearing filters or searching with another keyword.
                  </div>

                  <button
                    className="btn btn-outline-primary btn-sm mt-3"
                    style={{ borderRadius: 12, fontWeight: 800 }}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}