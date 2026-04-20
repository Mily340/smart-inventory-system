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
      const [pRes, cRes] = await Promise.all([
        client.get("/products"),
        client.get("/categories"),
      ]);

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

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Products</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {/* Create */}
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Create Product</h6>

            <form onSubmit={createProduct} className="row g-2">
              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Unit (pcs/kg/etc)"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <input
                  className="form-control"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
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

              <div className="col-md-1">
                <button className="btn btn-primary w-100">Create</button>
              </div>

              <div className="col-12">
                <input
                  className="form-control"
                  placeholder="Image URL (optional) - https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <div className="form-text">
                  Tip: Use a direct image link (ends with .jpg/.png/.webp) or any https image URL.
                </div>
              </div>

              <div className="col-12">
                <input
                  className="form-control"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Image</th>
                  <th>Code</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th style={{ width: 120 }}>Actions</th>
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
                          width: 70,
                          height: 50,
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
                    <td>{p.code || "-"}</td>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.category?.name || categoryById.get(p.categoryId)?.name || "-"}</td>
                    <td>{p.unit}</td>
                    <td>{p.price ?? "-"}</td>
                    <td>{p.description || "-"}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(p)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {products.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">
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
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={saveEdit}>
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Product</h5>
                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <div className="row g-2">
                      <div className="col-md-4">
                        <label className="form-label">SKU</label>
                        <input
                          className="form-control"
                          value={editSku}
                          onChange={(e) => setEditSku(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Unit</label>
                        <input
                          className="form-control"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Price</label>
                        <input
                          className="form-control"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-md-8">
                        <label className="form-label">Category</label>
                        <select
                          className="form-select"
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
                        <label className="form-label">Image URL (optional)</label>
                        <input
                          className="form-control"
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
                              maxHeight: 220,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid #eee",
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

                      <div className="col-12">
                        <label className="form-label">Description</label>
                        <input
                          className="form-control"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeEdit}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" disabled={savingEdit}>
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