import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Inventory() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // forms
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");

  const fetchAll = async (selectedBranchId) => {
    setError("");
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        client.get("/branches"),
        client.get("/products"),
      ]);

      const b = bRes.data?.data || [];
      const p = pRes.data?.data || [];
      setBranches(b);
      setProducts(p);

      const bId = selectedBranchId || b[0]?.id || "";
      setBranchId(bId);

      if (bId) {
        const invRes = await client.get(`/inventory?branchId=${bId}`);
        setInventory(invRes.data?.data || []);
      } else {
        setInventory([]);
      }

      if (!productId && p.length > 0) setProductId(p[0].id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load inventory";
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

  const changeBranch = async (e) => {
    const id = e.target.value;
    setBranchId(id);
    fetchAll(id);
  };

  const stockIn = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/inventory/stock-in", {
        branchId,
        productId,
        quantity: Number(qty),
        reason: "Frontend stock in",
      });
      setQty("");
      fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Stock-in failed");
    }
  };

  const stockOut = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/inventory/stock-out", {
        branchId,
        productId,
        quantity: Number(qty),
        reason: "Frontend stock out",
      });
      setQty("");
      fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Stock-out failed");
    }
  };

  const updateReorder = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.patch("/inventory/reorder-level", {
        branchId,
        productId,
        reorderLevel: Number(reorderLevel),
      });
      setReorderLevel("");
      fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Update reorder level failed");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Inventory</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <label className="form-label">Branch</label>
            <select className="form-select" value={branchId} onChange={changeBranch}>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code ? `${b.code} - ` : ""}{b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label">Product</label>
            <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `${p.code} - ` : ""}{p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Stock Actions</h6>

            <form className="row g-2 mb-3" onSubmit={stockIn}>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Quantity"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <button className="btn btn-success w-100">Stock In</button>
              </div>
              <div className="col-md-3">
                <button className="btn btn-danger w-100" onClick={stockOut} type="button">
                  Stock Out
                </button>
              </div>
            </form>

            <form className="row g-2" onSubmit={updateReorder}>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Reorder level"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-3">
                <button className="btn btn-primary w-100">Update Reorder</button>
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
                  <th>Product</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Reorder Level</th>
                  <th>Low Stock</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => {
                  const low = row.quantity <= row.reorderLevel;
                  return (
                    <tr key={row.id}>
                      <td>{row.product?.name}</td>
                      <td>{row.product?.category?.name || "-"}</td>
                      <td>{row.quantity}</td>
                      <td>{row.reorderLevel}</td>
                      <td>{low ? <span className="badge bg-danger">LOW</span> : <span className="badge bg-success">OK</span>}</td>
                    </tr>
                  );
                })}

                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No inventory records
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