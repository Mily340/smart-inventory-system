// frontend/src/pages/Categories.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const smallActionBtnStyle = {
  borderRadius: 9,
  fontWeight: 700,
  padding: "5px 10px",
  fontSize: 13,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
};

export default function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editOriginalName, setEditOriginalName] = useState("");

  const canSaveEdit = useMemo(() => {
    const n = (editName || "").trim();
    const o = (editOriginalName || "").trim();
    return n.length > 0 && n !== o && !savingEdit;
  }, [editName, editOriginalName, savingEdit]);

  const summary = useMemo(() => {
    const latest = categories[0]?.name || "—";

    return {
      total: categories.length,
      latest,
    };
  }, [categories]);

  const handleUnauthorized = (msg) => {
    if (String(msg || "").toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
      localStorage.removeItem("branchId");
      navigate("/login");
      return true;
    }

    return false;
  };

  const fetchCategories = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await client.get("/categories");
      setCategories(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load categories";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCategory = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await client.post("/categories", { name: name.trim() });
      setName("");
      await fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create category");
    }
  };

  const openEdit = (c) => {
    setError("");
    setEditId(c.id);
    setEditName(c.name || "");
    setEditOriginalName(c.name || "");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;

    setEditOpen(false);
    setEditId("");
    setEditName("");
    setEditOriginalName("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSaveEdit) return;

    setSavingEdit(true);

    try {
      await client.put(`/categories/${editId}`, { name: editName.trim() });

      setEditOpen(false);
      setEditId("");
      setEditName("");
      setEditOriginalName("");

      await fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update category");
    } finally {
      setSavingEdit(false);
    }
  };

  const pageWrapStyle = {
    marginTop: 18,
    paddingBottom: 26,
  };

  const panelStyle = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.35)",
    boxShadow: "0 10px 26px rgba(15,23,42,.06)",
    overflow: "hidden",
  };

  const headerCardStyle = {
    background: "linear-gradient(180deg, rgba(219,234,254,.55), rgba(255,255,255,1))",
    borderBottom: "1px solid rgba(148,163,184,.25)",
  };

  const inputStyle = {
    borderRadius: 12,
  };

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Categories
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              Manage product categories used for organizing inventory items.
            </div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            style={{
              borderRadius: 10,
              fontWeight: 700,
              padding: "8px 14px",
              background: "rgba(255,255,255,.85)",
            }}
            onClick={fetchCategories}
            disabled={loading}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>

        {error ? (
          <div className="alert alert-danger" style={{ borderRadius: 14 }}>
            {error}
          </div>
        ) : null}

        <div className="row g-3 mb-4">
          <SummaryCard
            title="Total Categories"
            value={summary.total}
            icon="bi-tags"
            hint="Product classification groups"
          />
          <SummaryCard
            title="Latest Category"
            value={summary.latest}
            icon="bi-clock-history"
            hint="Most recently created"
          />
        </div>

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Create Category
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Add a category to group related products.
                </div>
              </div>

              <span
                className="text-muted"
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,.35)",
                  background: "rgba(255,255,255,.85)",
                }}
              >
                Auto code generated
              </span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={createCategory} className="row g-2 align-items-end">
              <div className="col-12 col-lg-9">
                <label className="form-label small text-muted mb-1">Category Name</label>
                <input
                  className="form-control"
                  style={inputStyle}
                  placeholder="Category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-lg-3 d-grid">
                <button
                  className="btn btn-primary"
                  style={{
                    borderRadius: 12,
                    fontWeight: 800,
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Category List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${categories.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading categories...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 120 }}>Code</th>
                      <th style={{ minWidth: 240 }}>Name</th>
                      <th style={{ minWidth: 220 }}>Created</th>
                      <th style={{ width: 130, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 800 }}>{c.code || "-"}</td>
                        <td style={{ fontWeight: 800 }}>{c.name || "-"}</td>
                        <td>{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={smallActionBtnStyle}
                            onClick={() => openEdit(c)}
                          >
                            <i className="bi bi-pencil-square me-1"></i>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}

                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center text-muted py-4">
                          No categories found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              Category codes are generated automatically and remain unchanged after editing.
            </div>
          </div>
        </div>
      </div>

      {editOpen ? (
        <>
          <div className="modal show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content"
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,.35)",
                  boxShadow: "0 18px 45px rgba(15,23,42,.16)",
                  overflow: "hidden",
                }}
              >
                <form onSubmit={saveEdit}>
                  <div
                    className="modal-header"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(219,234,254,.65), rgba(255,255,255,1))",
                    }}
                  >
                    <div>
                      <h5 className="modal-title" style={{ fontWeight: 900 }}>
                        Edit Category
                      </h5>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Update the category name. Code will remain unchanged.
                      </div>
                    </div>

                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <label className="form-label small text-muted mb-1">Category Name</label>
                    <input
                      className="form-control"
                      style={inputStyle}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      autoFocus
                    />

                    <div className="form-text">
                      Save button is enabled only after changing the category name.
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ borderRadius: 10, fontWeight: 700 }}
                      onClick={closeEdit}
                      disabled={savingEdit}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn btn-primary"
                      style={{ borderRadius: 10, fontWeight: 800 }}
                      disabled={!canSaveEdit}
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeEdit} />
        </>
      ) : null}
    </>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-12 col-md-6">
      <div
        className="p-3 h-100"
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,.28)",
          boxShadow: "0 8px 18px rgba(15,23,42,.05)",
          background: "rgba(255,255,255,.88)",
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div className="text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {title}
            </div>

            <div
              style={{
                fontSize: typeof value === "number" ? 28 : 22,
                fontWeight: 900,
                color: "#0F172A",
              }}
            >
              {value}
            </div>

            <div className="text-muted" style={{ fontSize: 12 }}>
              {hint}
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "rgba(219,234,254,.55)",
              border: "1px solid rgba(147,197,253,.55)",
              color: "#1D4ED8",
              fontSize: 18,
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