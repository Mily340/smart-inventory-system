// frontend/src/pages/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const badgeStyle = (status) => {
  const s = String(status || "").toUpperCase();

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const map = {
    PENDING: {
      background: "#FFF7ED",
      color: "#9A3412",
      borderColor: "#FED7AA",
    },
    APPROVED: {
      background: "#ECFDF5",
      color: "#065F46",
      borderColor: "#A7F3D0",
    },
    PACKED: {
      background: "#EFF6FF",
      color: "#1D4ED8",
      borderColor: "#BFDBFE",
    },
    DISPATCHED: {
      background: "#F5F3FF",
      color: "#5B21B6",
      borderColor: "#DDD6FE",
    },
    DELIVERED: {
      background: "#ECFEFF",
      color: "#0E7490",
      borderColor: "#A5F3FC",
    },
    CANCELLED: {
      background: "#FEF2F2",
      color: "#B91C1C",
      borderColor: "#FECACA",
    },
  };

  return {
    ...base,
    ...(map[s] || {
      background: "#F3F4F6",
      color: "#374151",
      borderColor: "#E5E7EB",
    }),
  };
};

const actionCompleteStyle = (type) => {
  const isDelivered = type === "DELIVERED";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontSize: 18,
    fontWeight: 900,
    border: isDelivered ? "1px solid #A7F3D0" : "1px solid #FECACA",
    background: isDelivered ? "#ECFDF5" : "#FEF2F2",
    color: isDelivered ? "#047857" : "#B91C1C",
  };
};

export default function Orders() {
  const navigate = useNavigate();

  const [distributors, setDistributors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [distributorId, setDistributorId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [error, setError] = useState("");

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInventoryOfficer = role === "INVENTORY_OFFICER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchStaff = role === "BRANCH_STAFF";

  const isBranchScoped = isBranchManager || isBranchStaff;
  const canManageWorkflow = isSuperAdmin || isInventoryOfficer || isBranchManager;

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

  const fetchStockForBranch = async (bId) => {
    if (!bId) return;

    setLoadingStock(true);

    try {
      const res = await client.get(`/inventory?branchId=${bId}`);
      const data = res.data?.data || [];

      data.sort((a, b) => (a.product?.name || "").localeCompare(b.product?.name || ""));
      setStockItems(data);

      const exists = data.some((it) => it.productId === productId);

      if (!exists) {
        const first = data[0];
        setProductId(first ? first.productId : "");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branch stock";
      setError(msg);
      handleUnauthorized(msg);
      setStockItems([]);
      setProductId("");
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      if (isBranchScoped && !assignedBranchId) {
        setError("No branch is assigned to this account. Please contact the administrator.");
        setOrders([]);
        setStockItems([]);
        setLoading(false);
        return;
      }

      /*
        Important:
        The order table should always show the full accessible order list.
        The selected branch is only used for creating an order and loading branch stock.
      */
      const orderUrl = "/orders";

      if (isBranchScoped) {
        const [dRes, oRes] = await Promise.all([
          client.get("/distributors"),
          client.get(orderUrl),
        ]);

        const d = dRes.data?.data || [];
        const o = oRes.data?.data || [];

        setDistributors(d);
        setBranches([]);
        setOrders(o);

        if (!distributorId && d[0]?.id) {
          setDistributorId(d[0].id);
        }

        setBranchId(assignedBranchId);
        await fetchStockForBranch(assignedBranchId);
      } else {
        const [dRes, bRes, oRes] = await Promise.all([
          client.get("/distributors"),
          client.get("/branches"),
          client.get(orderUrl),
        ]);

        const d = dRes.data?.data || [];
        const b = bRes.data?.data || [];
        const o = oRes.data?.data || [];

        setDistributors(d);
        setBranches(b);
        setOrders(o);

        const nextDistributorId = distributorId || (d[0]?.id ?? "");
        const nextBranchId = branchId || (b[0]?.id ?? "");

        if (!distributorId && nextDistributorId) setDistributorId(nextDistributorId);
        if (!branchId && nextBranchId) setBranchId(nextBranchId);

        if (nextBranchId) await fetchStockForBranch(nextBranchId);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load orders";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBranchScoped && assignedBranchId) {
      setBranchId(assignedBranchId);
    }

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!branchId) return;

    fetchStockForBranch(branchId);
    setQuantity("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const selectedStock = useMemo(
    () => stockItems.find((it) => it.productId === productId),
    [stockItems, productId]
  );

  const availableQty = Number(selectedStock?.quantity ?? 0);
  const unitPrice = Number(selectedStock?.product?.price ?? 0);

  const assignedBranchName = useMemo(() => {
    if (!isBranchScoped) return "";

    const fromOrders = orders.find(
      (o) => o.branch?.id === assignedBranchId || o.branchId === assignedBranchId
    );

    if (fromOrders?.branch?.name) return fromOrders.branch.name;

    const fromStock = stockItems.find(
      (it) => it.branch?.id === assignedBranchId || it.branchId === assignedBranchId
    );

    if (fromStock?.branch?.name) return fromStock.branch.name;

    return "Assigned Branch";
  }, [assignedBranchId, isBranchScoped, orders, stockItems]);

  const qtyNum = useMemo(() => {
    const n = Number(quantity);
    return Number.isInteger(n) ? n : NaN;
  }, [quantity]);

  const qtyValid = Number.isInteger(qtyNum) && qtyNum > 0 && qtyNum <= availableQty;

  const canCreate =
    distributorId &&
    branchId &&
    productId &&
    unitPrice > 0 &&
    availableQty > 0 &&
    qtyValid &&
    !loadingStock;

  const previewTotal = useMemo(() => {
    if (!qtyValid || unitPrice <= 0) return 0;
    return qtyNum * unitPrice;
  }, [qtyValid, qtyNum, unitPrice]);

  const createOrder = async (e) => {
    e.preventDefault();
    setError("");

    const finalBranchId = isBranchScoped ? assignedBranchId : branchId;

    if (!distributorId || !finalBranchId || !productId) {
      setError("Please select distributor, branch and product.");
      return;
    }

    if (availableQty <= 0) {
      setError("Selected product is out of stock in this branch.");
      return;
    }

    if (!qtyValid) {
      setError(`Quantity must be between 1 and ${availableQty}.`);
      return;
    }

    try {
      await client.post("/orders", {
        distributorId,
        branchId: finalBranchId,
        items: [{ productId, quantity: qtyNum }],
      });

      setQuantity("");
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create order");
    }
  };

  const updateStatus = async (id, status) => {
    setError("");

    try {
      await client.patch(`/orders/${id}/status`, { status });
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    }
  };

  const renderStatusButtons = (o) => {
    if (o.status === "DELIVERED") {
      return (
        <span style={actionCompleteStyle("DELIVERED")} title="Delivered">
          <i className="bi bi-check-lg"></i>
        </span>
      );
    }

    if (o.status === "CANCELLED") {
      return (
        <span style={actionCompleteStyle("CANCELLED")} title="Cancelled">
          <i className="bi bi-x-lg"></i>
        </span>
      );
    }

    if (isBranchStaff) {
      if (o.status === "PENDING") {
        return (
          <button
            className="btn btn-sm btn-outline-danger"
            style={{ borderRadius: 10, fontWeight: 700 }}
            onClick={() => updateStatus(o.id, "CANCELLED")}
          >
            Cancel
          </button>
        );
      }

      return <span className="text-muted">—</span>;
    }

    if (!canManageWorkflow) {
      return <span className="text-muted">—</span>;
    }

    if (o.status === "PENDING") {
      return (
        <div className="d-flex gap-2 flex-wrap justify-content-center">
          <button
            className="btn btn-sm btn-outline-success"
            style={{ borderRadius: 10, fontWeight: 700 }}
            onClick={() => updateStatus(o.id, "APPROVED")}
          >
            Approve
          </button>

          <button
            className="btn btn-sm btn-outline-danger"
            style={{ borderRadius: 10, fontWeight: 700 }}
            onClick={() => updateStatus(o.id, "CANCELLED")}
          >
            Cancel
          </button>
        </div>
      );
    }

    if (o.status === "APPROVED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => updateStatus(o.id, "PACKED")}
        >
          Mark Packed
        </button>
      );
    }

    if (o.status === "PACKED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => updateStatus(o.id, "DISPATCHED")}
        >
          Dispatch
        </button>
      );
    }

    if (o.status === "DISPATCHED") {
      return (
        <button
          className="btn btn-sm btn-outline-secondary"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => updateStatus(o.id, "DELIVERED")}
        >
          Delivered
        </button>
      );
    }

    return <span className="text-muted">—</span>;
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

  const hintPillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(147,197,253,.6)",
    background: "rgba(239,246,255,.85)",
    color: "#1D4ED8",
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: "nowrap",
  };

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Orders
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              {isBranchScoped
                ? "Manage orders for your assigned branch only."
                : "Create orders using branch stock and track order workflow."}
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
            onClick={fetchAll}
            disabled={loading}
            title="Refresh full order list"
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

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                  Create Order
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {isBranchScoped
                    ? "Branch is locked to your assigned branch."
                    : "Select distributor, branch, product from stock, then quantity."}
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
                1 item per order
              </span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={createOrder} className="row g-2 align-items-end">
              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1">Distributor</label>
                <select
                  className="form-select"
                  style={{ borderRadius: 12 }}
                  value={distributorId}
                  onChange={(e) => setDistributorId(e.target.value)}
                  required
                >
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code ? `${d.code} - ` : ""}
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label small text-muted mb-1">Branch</label>

                {isBranchScoped ? (
                  <div
                    className="form-control"
                    style={{
                      borderRadius: 12,
                      background: "#F8FAFC",
                      color: "#0F172A",
                      fontWeight: 700,
                    }}
                  >
                    {assignedBranchName}
                  </div>
                ) : (
                  <select
                    className="form-select"
                    style={{ borderRadius: 12 }}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code ? `${b.code} - ` : ""}
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small text-muted mb-1">
                  Product from branch stock
                </label>
                <select
                  className="form-select"
                  style={{ borderRadius: 12 }}
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setQuantity("");
                  }}
                  required
                  disabled={loadingStock}
                >
                  {stockItems.map((it) => (
                    <option
                      key={it.productId}
                      value={it.productId}
                      disabled={(it.quantity ?? 0) <= 0}
                    >
                      {it.product?.code ? `${it.product.code} - ` : ""}
                      {it.product?.name}
                      {typeof it.product?.price === "number" ? ` (৳${it.product.price})` : ""}
                      {` | Avl: ${it.quantity ?? 0}`}
                    </option>
                  ))}
                </select>

                <div className="form-text">
                  {loadingStock
                    ? "Loading branch stock..."
                    : stockItems.length === 0
                    ? "No products stocked in this branch yet."
                    : null}
                </div>
              </div>

              <div className="col-8 col-md-1">
                <label className="form-label small text-muted mb-1">Qty</label>
                <input
                  className={`form-control ${quantity && !qtyValid ? "is-invalid" : ""}`}
                  style={{ borderRadius: 12 }}
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!productId || availableQty <= 0 || loadingStock}
                />

                {quantity && !qtyValid ? (
                  <div className="invalid-feedback">Max {availableQty}</div>
                ) : null}
              </div>

              <div className="col-4 col-md-1 d-grid">
                <button
                  className="btn btn-primary"
                  style={{
                    borderRadius: 12,
                    fontWeight: 800,
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                  }}
                  disabled={!canCreate}
                >
                  Create
                </button>
              </div>

              <div className="col-12">
                <div className="d-flex flex-wrap gap-2" style={{ marginTop: 6, fontSize: 13 }}>
                  <span
                    style={{
                      ...hintPillStyle,
                      background: "rgba(236,254,255,.75)",
                      borderColor: "rgba(165,243,252,.85)",
                      color: "#0E7490",
                    }}
                  >
                    Available:{" "}
                    <span style={{ color: "#0F172A" }}>{productId ? availableQty : "-"}</span>
                  </span>

                  <span
                    style={{
                      ...hintPillStyle,
                      background: "rgba(245,243,255,.75)",
                      borderColor: "rgba(221,214,254,.9)",
                      color: "#5B21B6",
                    }}
                  >
                    Unit:{" "}
                    <span style={{ color: "#0F172A" }}>
                      {unitPrice ? `৳${unitPrice}` : "-"}
                    </span>
                  </span>

                  <span
                    style={{
                      ...hintPillStyle,
                      background: "rgba(236,253,245,.75)",
                      borderColor: "rgba(167,243,208,.9)",
                      color: "#065F46",
                    }}
                  >
                    Preview Total:{" "}
                    <span style={{ color: "#0F172A" }}>
                      {qtyValid ? `৳${previewTotal}` : "-"}
                    </span>
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                {isBranchScoped ? "Branch Orders" : "Order List"}
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${orders.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 90 }}>Code</th>
                      <th style={{ minWidth: 180 }}>Distributor</th>
                      <th style={{ minWidth: 140 }}>Branch</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ width: 120 }}>Total</th>
                      <th style={{ minWidth: 320 }}>Items</th>
                      <th style={{ width: 180, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 800 }}>{o.code || "-"}</td>
                        <td>{o.distributor?.name || "-"}</td>
                        <td>{o.branch?.name || "-"}</td>
                        <td>
                          <span style={badgeStyle(o.status)}>{o.status}</span>
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          {typeof o.totalAmount === "number"
                            ? `৳${o.totalAmount}`
                            : o.totalAmount}
                        </td>
                        <td>
                          {o.items?.length ? (
                            o.items.map((it) => (
                              <div key={it.id} style={{ lineHeight: 1.35 }}>
                                <span style={{ fontWeight: 700 }}>{it.product?.name}</span>{" "}
                                <span className="text-muted">x {it.quantity}</span>{" "}
                                <span className="text-muted">(@{it.unitPrice})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-center">{renderStatusButtons(o)}</td>
                      </tr>
                    ))}

                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No orders found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              {isBranchStaff
                ? "Branch Staff can create orders and cancel only PENDING orders."
                : isBranchManager
                ? "Branch Manager can manage orders only for the assigned branch."
                : canManageWorkflow
                ? "Admin Staff can manage full order workflow: PENDING → APPROVED → PACKED → DISPATCHED → DELIVERED."
                : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}