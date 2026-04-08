import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const fetchAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        client.get("/products"),
        client.get("/categories"),
      ]);
      setProducts(pRes.data?.data || []);
      const cats = cRes.data?.data || [];
      setCategories(cats);
      if (!categoryId && cats.length > 0) setCategoryId(cats[0].id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load data";
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
    fetchAll();
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/products", {
        sku,
        name,
        unit,
        description: description || null,
        categoryId,
      });
      setSku("");
      setName("");
      setUnit("pcs");
      setDescription("");
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create product");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Products</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

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

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} - ` : ""}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <button className="btn btn-primary w-100">Create</button>
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

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.code || "-"}</td>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.category?.name || "-"}</td>
                    <td>{p.unit}</td>
                    <td>{p.description || "-"}</td>
                  </tr>
                ))}

                {products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No products found
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