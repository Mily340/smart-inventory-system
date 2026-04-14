import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function BranchStock() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId),
    [branches, branchId]
  );

  const fetchBranches = async () => {
    const res = await client.get("/branches");
    const data = res.data?.data || [];
    setBranches(data);
    if (!branchId && data.length > 0) setBranchId(data[0].id);
  };

  const fetchInventory = async (bId) => {
    if (!bId) return;
    const res = await client.get(`/inventory?branchId=${bId}`);
    setItems(res.data?.data || []);
  };

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      await fetchBranches();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branches";
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!branchId) return;
      setError("");
      setLoading(true);
      try {
        await fetchInventory(branchId);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load branch stock");
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Branch Stock</h4>

          <div style={{ minWidth: 320 }}>
            <select
              className="form-select"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code ? `${b.code} - ` : ""}
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedBranch ? (
          <div className="text-muted mb-2">
            Viewing stock for: <strong>{selectedBranch.name}</strong>
          </div>
        ) : null}

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Qty Available</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const qty = Number(it.quantity || 0);
                  const rl = Number(it.reorderLevel || 0);
                  const low = rl > 0 && qty < rl;

                  return (
                    <tr key={it.id} className={low ? "table-warning" : ""}>
                      <td>{it.product?.code || "-"}</td>
                      <td>{it.product?.name || "-"}</td>
                      <td>{it.product?.category?.name || "-"}</td>
                      <td>{it.product?.unit || "-"}</td>
                      <td className="fw-semibold">{qty}</td>
                      <td>{rl}</td>
                      <td>
                        {low ? (
                          <span className="badge bg-warning text-dark">LOW STOCK</span>
                        ) : (
                          <span className="badge bg-success">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No inventory found for this branch (stock in products first).
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