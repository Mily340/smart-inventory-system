// frontend/src/pages/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const FALLBACK_IMG = "https://via.placeholder.com/400x260?text=Product";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Edit modal state
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

  const fetchAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([client.get("/products"), client.get("/categories")]);
      const prods = pRes.data?.data || [];
      const cats = cRes.data?.data || [];

      setProducts(prods);
      setCategories(cats);

      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load data";
      setError(msg);

      if (msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("fullName");
        navigate("/login");
      }
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
        sku,
        name,
        unit,
        price: Number(price),
        imageUrl: imageUrl?.trim() ? imageUrl.trim() : null,
        description: description || null,
        categoryId,
      });

      setSku("");
      setName("");
      setUnit("pcs");
      setPrice("");
      setImageUrl("");
      setDescription("");
      fetchAll();
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
    setEditCategoryId(p.categoryId || p.category?.id || (categories[0]?.id || ""));
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
        sku: editSku,
        name: editName,
        unit: editUnit,
        price: Number(editPrice),
        imageUrl: editImageUrl?.trim() ? editImageUrl.trim() : null,
        description: editDescription || null,
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

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 14 }}>
        <div className="d-flex justify-content-between align-items-end mb-2">
          <div>
            <h4 className="m-0" style={{ fontWeight: 800, letterSpacing: 0.2 }}>
              Products
            </h4>
            <div className="text-muted" style={{ fontSize: 12 }}>
              Manage products, prices and images
            </div>
          </div>
        </div>

        {error ? <div className="alert alert-danger py-2 mb-2">{error}</div> : null}

        {/* Create */}
        <div className="card mb-3" style={{ borderRadius: 14 }}>
          <div className="card-body" style={{ padding: 14 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="card-title m-0" style={{ fontWeight: 800 }}>
                Create Product
              </h6>
              <span className="badge rounded-pill text-bg-light" style={{ fontSize: 11 }}>
                SKU • Name • Unit • Price • Category
              </span>
            </div>

            <form onSubmit={createProduct} className="row g-2 align-items-end">
        {/* SKU */}
        <div className="col-12 col-md-2">
          <label className="form-label mb-1" style={{ fontSize: 12 }}>
             SKU
          </label>
          <input
             className="form-control form-control-sm"
             placeholder="SKU-001"
             value={sku}
             onChange={(e) => setSku(e.target.value)}
             required
          />
        </div>

        {/* Name */}
        <div className="col-12 col-md-2">
          <label className="form-label mb-1" style={{ fontSize: 12 }}>
            Product name
          </label>
          <input
           className="form-control form-control-sm"
           placeholder="Product name"
           value={name}
           onChange={(e) => setName(e.target.value)}
           required
          />
        </div>

        {/* Unit */}
        <div className="col-12 col-md-2">
          <label className="form-label mb-1" style={{ fontSize: 12 }}>
            Unit
          </label>
          <input
            className="form-control form-control-sm"
            placeholder="pcs / ml / kg"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
          />
        </div>

        {/* Price */}
        <div className="col-12 col-md-2">
          <label className="form-label mb-1" style={{ fontSize: 12 }}>
            Price
          </label>
          <input
            className="form-control form-control-sm"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* Category - made wider */}
        <div className="col-12 col-md-3">
          <label className="form-label mb-1" style={{ fontSize: 12 }}>
            Category
          </label>
          <select
            className="form-select form-select-sm"
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

       {/* Create button */}
        <div className="col-12 col-md-1 d-grid">
         <button
          className="btn btn-primary btn-sm"
          style={{
          borderRadius: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
          paddingInline: 10,
          minHeight: 38,
        }}
        >
          Create
         </button>
        </div>

      {/* Image URL - slightly smaller */}
      <div className="col-12 col-md-6">
       <label className="form-label mb-1" style={{ fontSize: 12 }}>
             Image URL (optional)
        </label>
          <input
             className="form-control form-control-sm"
             placeholder="https://... (jpg/png/webp)"
             value={imageUrl}
             onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

       {/* Description - same line as Image URL */}
         <div className="col-12 col-md-6">
          <label className="form-label mb-1" style={{ fontSize: 12 }}>
             Description (optional)
          </label>
          <input
            className="form-control form-control-sm"
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          </div>
          </form>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ fontSize: 13 }}>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle" style={{ fontSize: 13 }}>
              <thead style={{ background: "#f7f7ff" }}>
                <tr>
                  <th style={{ width: 76 }}>Image</th>
                  <th style={{ width: 80 }}>Code</th>
                  <th style={{ width: 120 }}>SKU</th>
                  <th>Name</th>
                  <th style={{ width: 160 }}>Category</th>
                  <th style={{ width: 90 }}>Unit</th>
                  <th style={{ width: 90 }}>Price</th>
                  <th>Description</th>
                  <th style={{ width: 110 }}>Actions</th>
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
                          width: 58,
                          height: 42,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid #eee",
                          background: "#f2f2f2",
                        }}
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
                        }}
                      />
                    </td>
                    <td>{p.code || "-"}</td>
                    <td>{p.sku}</td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.category?.name || categoryById.get(p.categoryId)?.name || "-"}</td>
                    <td>{p.unit}</td>
                    <td>{p.price ?? "-"}</td>
                    <td className="text-muted">{p.description || "-"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        style={{ borderRadius: 10, whiteSpace: "nowrap" }}
                        onClick={() => openEdit(p)}
                      >
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
      </div>

      {/* Edit Modal */}
      {editOpen ? (
        <>
          <div className="modal show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: 14 }}>
                <form onSubmit={saveEdit}>
                  <div className="modal-header py-2">
                    <h5 className="modal-title">Edit Product</h5>
                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <div className="row g-2">
                      <div className="col-md-3">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          SKU
                        </label>
                        <input
                          className="form-control form-control-sm"
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Name
                        </label>
                        <input
                          className="form-control form-control-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Unit
                        </label>
                        <input
                          className="form-control form-control-sm"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Price
                        </label>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          min="0"
                          step="1"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Category
                        </label>
                        <select
                          className="form-select form-select-sm"
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

                      <div className="col-12">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Image URL (optional)
                        </label>
                        <input
                          className="form-control form-control-sm"
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
                              maxHeight: 200,
                              objectFit: "cover",
                              borderRadius: 12,
                              border: "1px solid #eee",
                              background: "#f2f2f2",
                            }}
                            onError={(e) => {
                              if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
                            }}
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label" style={{ fontSize: 12 }}>
                          Description
                        </label>
                        <input
                          className="form-control form-control-sm"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer py-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button className="btn btn-primary btn-sm" disabled={savingEdit}>
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