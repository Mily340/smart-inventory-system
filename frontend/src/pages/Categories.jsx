import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");

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
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>{c.code || "-"}</td>
                    <td>{c.name}</td>
                    <td>{new Date(c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}

                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center">
                      No categories found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}