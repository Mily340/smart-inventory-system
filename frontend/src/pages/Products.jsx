// frontend/src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const FALLBACK_IMG = "https://via.placeholder.com/400x260?text=Product";

const smallActionBtnStyle = {
  borderRadius: 8,
  fontWeight: 700,
  padding: "4px 8px",
  fontSize: 12,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const categoryById = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  const summary = useMemo(() => {
    return {
      total: products.length,
      categories: categories.length,
      latest: products[0]?.name || "—",
    };
  }, [products, categories]);

  const handleUnauthorized = (msg) => {
    if (String(msg || "").toLowerCase().includes("unauthorized")) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("fullName");
      sessionStorage.removeItem("branchId");
      navigate("/login");
      return true;
    }

    return false;
  };

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      const [pRes, cRes] = await Promise.all([
        client.get("/products"),
        client.get("/categories"),
      ]);

      const prods = pRes.data?.data || [];
      const cats = cRes.data?.data || [];

      setProducts(prods);
      setCategories(cats);

      if (!categoryId && cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load data";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await client.post("/products", {
        sku: sku.trim(),
        name: name.trim(),
        unit: unit.trim(),
        price: Number(price),
        imageUrl: imageUrl?.trim() ? imageUrl.trim() : null,
        description: description?.trim() ? description.trim() : null,
        categoryId,
      });

      setSku("");
      setName("");
      setUnit("pcs");
      setPrice("");
      setImageUrl("");
      setDescription("");

      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create product");
    }
  };

  const openEdit = (p) => {
    setError("");
    setEditId(p.id);
    setEditSku(p.sku || "");
    setEditName(p.name || "");
    setEditUnit(p.unit || "");
    setEditPrice(p.price ?? "");
    setEditImageUrl(p.imageUrl || "");
    setEditDescription(p.description || "");
    setEditCategoryId(p.categoryId || p.category?.id || categories[0]?.id || "");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditId("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSavingEdit(true);

    try {
      await client.put(`/products/${editId}`, {
        sku: editSku.trim(),
        name: editName.trim(),
        unit: editUnit.trim(),
        price: Number(editPrice),
        imageUrl: editImageUrl?.trim() ? editImageUrl.trim() : null,
        description: editDescription?.trim() ? editDescription.trim() : null,
        categoryId: editCategoryId,
      });

      setEditOpen(false);
      setEditId("");

      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update product");
    } finally {
      setSavingEdit(false);
    }
  };

  const pageWrapStyle = {
    marginTop: 10,
    paddingBottom: 18,
  };

  const panelStyle = {
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,.32)",
    boxShadow: "0 6px 16px rgba(15,23,42,.04)",
    overflow: "hidden",
  };

  const headerCardStyle = {
    background: "linear-gradient(180deg, rgba(219,234,254,.45), rgba(255,255,255,1))",
    borderBottom: "1px solid rgba(148,163,184,.22)",
  };

  const inputStyle = {
    borderRadius: 10,
  };

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h3 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Products
            </h3>
            <div className="text-muted" style={{ marginTop: 2, fontSize: 14 }}>
              Manage product details, categories, prices, and catalog images.
            </div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            style={{
              borderRadius: 10,
              fontWeight: 700,
              padding: "6px 12px",
              background: "rgba(255,255,255,.85)",
            }}
            onClick={fetchAll}
            disabled={loading}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>

        {error ? (
          <div className="alert alert-danger py-2 mb-2" style={{ borderRadius: 12 }}>
            {error}
          </div>
        ) : null}

        <div className="row g-2 mb-3">
          <SummaryCard
            title="Total Products"
            value={summary.total}
            icon="bi-box-seam"
            hint="Catalog items"
          />
          <SummaryCard
            title="Categories"
            value={summary.categories}
            icon="bi-tags"
            hint="Product groups"
          />
          <SummaryCard
            title="Latest Product"
            value={summary.latest}
            icon="bi-clock-history"
            hint="Recently added"
          />
        </div>

        <div className="card mb-3" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                  Create Product
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Add product details, price, category, and optional image.
                </div>
              </div>

              <span
                className="text-muted"
                style={{
                  fontSize: 11.5,
                  padding: "4px 9px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,.35)",
                  background: "rgba(255,255,255,.85)",
                }}
              >
                Auto product code
              </span>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            <form onSubmit={createProduct} className="row g-2 align-items-end">
              <div className="col-12 col-md-2">
                <label className="form-label small text-muted mb-1">SKU</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="SKU-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label small text-muted mb-1">Product Name</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-6 col-md-2">
                <label className="form-label small text-muted mb-1">Unit</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="pcs / ml / kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="col-6 col-md-2">
                <label className="form-label small text-muted mb-1">Price</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1">Category</label>
                <select
                  className="form-select form-select-sm"
                  style={inputStyle}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} - ` : ""}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-1 d-grid">
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    borderRadius: 10,
                    fontWeight: 800,
                    minHeight: 31,
                    whiteSpace: "nowrap",
                  }}
                >
                  Create
                </button>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1">Image URL optional</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="https://... (jpg/png/webp)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label small text-muted mb-1">Description optional</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="Short description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Product List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${products.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            {loading ? (
              <div className="text-muted">Loading products...</div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-sm table-bordered table-hover align-middle mb-0"
                  style={{ fontSize: 13 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 66 }}>Image</th>
                      <th style={{ width: 76 }}>Code</th>
                      <th style={{ width: 110 }}>SKU</th>
                      <th style={{ minWidth: 165 }}>Name</th>
                      <th style={{ width: 150 }}>Category</th>
                      <th style={{ width: 75 }}>Unit</th>
                      <th style={{ width: 80 }}>Price</th>
                      <th style={{ minWidth: 170 }}>Description</th>
                      <th style={{ width: 95, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <img
                            src={p.imageUrl || FALLBACK_IMG}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: 50,
                              height: 36,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #eee",
                              background: "#f2f2f2",
                            }}
                            onError={(e) => {
                              if (e.currentTarget.src !== FALLBACK_IMG) {
                                e.currentTarget.src = FALLBACK_IMG;
                              }
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 800 }}>{p.code || "-"}</td>
                        <td>{p.sku}</td>
                        <td style={{ fontWeight: 800 }}>{p.name}</td>
                        <td>{p.category?.name || categoryById.get(p.categoryId)?.name || "-"}</td>
                        <td>{p.unit}</td>
                        <td>{p.price ?? "-"}</td>
                        <td className="text-muted">{p.description || "-"}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={smallActionBtnStyle}
                            onClick={() => openEdit(p)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}

                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-3">
                          No products found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
              Product codes are generated automatically. SKU, name, unit, price, category, image,
              and description can be updated from Edit.
            </div>
          </div>
        </div>
      </div>

      {editOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2050,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "18px",
            background: "rgba(15, 23, 42, 0.42)",
          }}
        >
          <div
            style={{
              width: "min(760px, 96vw)",
              maxHeight: "88vh",
              borderRadius: 16,
              background: "#fff",
              border: "1px solid rgba(148,163,184,.35)",
              boxShadow: "0 18px 45px rgba(15,23,42,.22)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <form
              onSubmit={saveEdit}
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  background:
                    "linear-gradient(180deg, rgba(219,234,254,.65), rgba(255,255,255,1))",
                  borderBottom: "1px solid rgba(148,163,184,.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  flexShrink: 0,
                }}
              >
                <div>
                  <h5
                    className="m-0"
                    style={{
                      fontWeight: 900,
                      color: "#0F172A",
                      fontSize: 17,
                      lineHeight: 1.2,
                    }}
                  >
                    Edit Product
                  </h5>
                  <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                    Update product details and catalog image.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEdit}
                  style={{ flex: "0 0 auto", marginTop: 2 }}
                  aria-label="Close"
                />
              </div>

              <div
                style={{
                  padding: 14,
                  overflowY: "auto",
                  maxHeight: "calc(88vh - 108px)",
                }}
              >
                <div className="row g-2">
                  <div className="col-12 col-md-3">
                    <label className="form-label small text-muted mb-1">SKU</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label small text-muted mb-1">Name</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label small text-muted mb-1">Unit</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label small text-muted mb-1">Price</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      type="number"
                      min="0"
                      step="1"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted mb-1">Category</label>
                    <select
                      className="form-select form-select-sm"
                      style={inputStyle}
                      value={editCategoryId}
                      onChange={(e) => setEditCategoryId(e.target.value)}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `${c.code} - ` : ""}
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-8">
                    <label className="form-label small text-muted mb-1">Description</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small text-muted mb-1">Image URL optional</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="https://..."
                    />

                    <div className="mt-2">
                      <img
                        src={editImageUrl?.trim() ? editImageUrl.trim() : FALLBACK_IMG}
                        alt="Preview"
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: "100%",
                          maxHeight: 120,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          background: "#f2f2f2",
                        }}
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_IMG) {
                            e.currentTarget.src = FALLBACK_IMG;
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "8px 14px",
                  borderTop: "1px solid rgba(148,163,184,.25)",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  style={{ borderRadius: 9, fontWeight: 700 }}
                  onClick={closeEdit}
                  disabled={savingEdit}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: 9, fontWeight: 800 }}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
      <div
        className="h-100"
        style={{
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,.28)",
          boxShadow: "0 5px 13px rgba(15,23,42,.04)",
          background: "rgba(255,255,255,.88)",
          padding: "10px 14px",
          minHeight: 82,
        }}
      >
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div style={{ minWidth: 0 }}>
            <div className="text-muted" style={{ fontSize: 12, fontWeight: 800 }}>
              {title}
            </div>

            <div
              style={{
                fontSize: typeof value === "number" ? 23 : 18,
                lineHeight: 1.08,
                fontWeight: 900,
                color: "#0F172A",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 260,
              }}
              title={String(value)}
            >
              {value}
            </div>

            <div className="text-muted" style={{ fontSize: 11.5 }}>
              {hint}
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(219,234,254,.55)",
              border: "1px solid rgba(147,197,253,.55)",
              color: "#1D4ED8",
              fontSize: 15,
              flex: "0 0 auto",
            }}
          >
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}