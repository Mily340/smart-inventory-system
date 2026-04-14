import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create
  const [name, setName] = useState("");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await client.get("/categories");
      setCategories(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load categories";
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
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createCategory = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/categories", { name });
      setName("");
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create category");
    }
  };

  const openEdit = (c) => {
    setError("");
    setEditId(c.id);
    setEditName(c.name || "");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditId("");
    setEditName("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSavingEdit(true);

    try {
      // If your backend uses PATCH instead of PUT, change put -> patch
      await client.put(`/categories/${editId}`, { name: editName });

      setEditOpen(false);
      setEditId("");
      setEditName("");
      fetchCategories();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update category");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Categories</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Create Category</h6>

            <form onSubmit={createCategory} className="row g-2">
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="Category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <button className="btn btn-primary w-100">Create</button>
              </div>
            </form>
          </div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Created</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code || "-"}</td>
                    <td>{c.name}</td>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No categories found
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
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={saveEdit}>
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Category</h5>
                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <label className="form-label">Category Name</label>
                    <input
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeEdit}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save"}
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