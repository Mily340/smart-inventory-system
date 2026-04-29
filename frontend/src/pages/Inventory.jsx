// frontend/src/pages/Inventory.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Inventory() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");

  const [qty, setQty] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      // keep existing selected product if possible
      const currentProductExists = p.some((x) => x.id === productId);
      const nextProductId = currentProductExists ? productId : p[0]?.id || "";
      setProductId(nextProductId);

      if (bId) {
        const invRes = await client.get(`/inventory?branchId=${bId}`);
        setInventory(invRes.data?.data || []);
      } else {
        setInventory([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load inventory";
      setError(msg);

      if (String(msg).toLowerCase().includes("unauthorized")) {
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

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) || null,
    [branches, branchId]
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalQty = inventory.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const lowCount = inventory.reduce(
      (sum, r) =>
        sum + ((Number(r.quantity) || 0) <= (Number(r.reorderLevel) || 0) ? 1 : 0),
      0
    );
    return { totalItems, totalQty, lowCount };
  }, [inventory]);

  const changeBranch = (e) => {
    const id = e.target.value;
    setBranchId(id);
    fetchAll(id);
  };

  const qtyNum = Number(qty);
  const reorderNum = Number(reorderLevel);

  const canDoQty = branchId && productId && Number.isFinite(qtyNum) && qtyNum > 0;
  const canDoReorder = branchId && productId && Number.isFinite(reorderNum) && reorderNum >= 0;

  const stockIn = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await client.post("/inventory/stock-in", {
        branchId,
        productId,
        quantity: qtyNum,
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
        quantity: qtyNum,
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
        reorderLevel: reorderNum,
      });
      setReorderLevel("");
      fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Update reorder level failed");
    }
  };

  // ---------- Compact styles ----------
  const cardStyle = {
    borderRadius: 16,
    border: "1px solid #E8EEF7",
    boxShadow: "0 10px 26px rgba(28, 39, 64, 0.05)",
  };

  const pillStyle = (bg, color, border) => ({
    background: bg,
    color,
    border: `1px solid ${border}`,
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
  });

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 18, marginBottom: 24 }}>
        {/* Header (compact) */}
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-2">
          <div>
            <h2 className="m-0" style={{ fontWeight: 850, letterSpacing: 0.2, fontSize: 28 }}>
              Inventory
            </h2>
            <div className="text-muted" style={{ marginTop: 2, fontSize: 13 }}>
              Stock operations & branch overview
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <span style={pillStyle("#EAF2FF", "#2457C5", "#CFE0FF")}>
              Branch:{" "}
              {selectedBranch
                ? `${selectedBranch.code ? selectedBranch.code + " - " : ""}${selectedBranch.name}`
                : "-"}
            </span>

            <span style={pillStyle("#F4F0FF", "#5B3CC4", "#E0D7FF")}>
              Product:{" "}
              {selectedProduct
                ? `${selectedProduct.code ? selectedProduct.code + " - " : ""}${selectedProduct.name}`
                : "-"}
            </span>
          </div>
        </div>

        {error ? <div className="alert alert-danger py-2 my-2">{error}</div> : null}

        {/* Filters (compact) */}
        <div className="card mb-2" style={cardStyle}>
          <div className="card-body" style={{ padding: 12 }}>
            <div className="row g-2 align-items-end">
              <div className="col-12 col-lg-6">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                  Branch
                </label>
                <select
                  className="form-select form-select-sm"
                  value={branchId}
                  onChange={changeBranch}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-lg-6">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                  Product
                </label>
                <select
                  className="form-select form-select-sm"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ` : ""}
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI cards (compact) */}
        <div className="row g-2 mb-2">
          <div className="col-12 col-md-4">
            <div className="card h-100" style={cardStyle}>
              <div className="card-body" style={{ padding: 12 }}>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Total Items
                </div>
                <div style={{ fontSize: 26, fontWeight: 850, lineHeight: 1.1 }}>
                  {stats.totalItems}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  products listed in this branch
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100" style={cardStyle}>
              <div className="card-body" style={{ padding: 12 }}>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Low Stock Items
                </div>
                <div style={{ fontSize: 26, fontWeight: 850, lineHeight: 1.1 }}>
                  {stats.lowCount}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  qty ≤ reorder level
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100" style={cardStyle}>
              <div className="card-body" style={{ padding: 12 }}>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Total Quantity
                </div>
                <div style={{ fontSize: 26, fontWeight: 850, lineHeight: 1.1 }}>
                  {stats.totalQty}
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  sum of all quantities
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock actions (compact) */}
        <div className="card mb-3" style={cardStyle}>
          <div className="card-body" style={{ padding: 12 }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <h5 className="m-0" style={{ fontWeight: 850, fontSize: 18 }}>
                Stock Actions
              </h5>
              <span className="text-muted" style={{ fontSize: 13 }}>
                Choose branch + product, then apply updates
              </span>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                  Quantity
                </label>
                <input
                  className="form-control form-control-sm"
                  placeholder="e.g., 10"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="col-12 col-lg-4">
                <form onSubmit={stockIn}>
                  <button className="btn btn-success btn-sm w-100" type="submit" disabled={!canDoQty}>
                    Stock In
                  </button>
                </form>
              </div>

              <div className="col-12 col-lg-4">
                <form onSubmit={stockOut}>
                  <button className="btn btn-danger btn-sm w-100" type="submit" disabled={!canDoQty}>
                    Stock Out
                  </button>
                </form>
              </div>
            </div>

            <hr className="my-3" />

            <form className="row g-2 align-items-end" onSubmit={updateReorder}>
              <div className="col-12 col-lg-8">
                <label className="form-label fw-semibold mb-1" style={{ fontSize: 13 }}>
                  Reorder Level
                </label>
                <input
                  className="form-control form-control-sm"
                  placeholder="e.g., 5"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="col-12 col-lg-4">
                <button className="btn btn-primary btn-sm w-100" type="submit" disabled={!canDoReorder}>
                  Update Reorder Level
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table (compact) */}
        {loading ? (
          <div className="text-muted" style={{ fontSize: 13 }}>
            Loading...
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle" style={{ background: "#fff" }}>
              <thead style={{ background: "#F3F6FF" }}>
                <tr>
                  <th style={{ width: 260, padding: "10px 12px" }}>Product</th>
                  <th style={{ padding: "10px 12px" }}>Category</th>
                  <th style={{ width: 120, padding: "10px 12px" }}>Qty</th>
                  <th style={{ width: 140, padding: "10px 12px" }}>Reorder</th>
                  <th style={{ width: 110, padding: "10px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => {
                  const q = Number(row.quantity) || 0;
                  const rl = Number(row.reorderLevel) || 0;
                  const low = q <= rl;

                  return (
                    <tr key={row.id} style={low ? { background: "#FFF5F5" } : undefined}>
                      <td className="fw-semibold" style={{ padding: "10px 12px" }}>
                        {row.product?.name}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{row.product?.category?.name || "-"}</td>
                      <td style={{ padding: "10px 12px" }}>{q}</td>
                      <td style={{ padding: "10px 12px" }}>{rl}</td>
                      <td style={{ padding: "10px 12px" }}>
                        {low ? (
                          <span className="badge" style={{ background: "#FAD7DF", color: "#8A1731", fontSize: 12 }}>
                            LOW
                          </span>
                        ) : (
                          <span className="badge" style={{ background: "#DFF7E7", color: "#0C5B2B", fontSize: 12 }}>
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted" style={{ padding: 14 }}>
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