import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Orders() {
  const navigate = useNavigate();

  const [distributors, setDistributors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);

  // Inventory for selected branch
  const [stockItems, setStockItems] = useState([]);

  const [distributorId, setDistributorId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [error, setError] = useState("");

  const role = localStorage.getItem("role") || "";
  const isBranchStaff = role === "BRANCH_STAFF";
  const isAdminStaff = ["SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"].includes(role);

  const handleUnauthorized = (msg) => {
    if (String(msg || "").toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
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
      const [dRes, bRes, oRes] = await Promise.all([
        client.get("/distributors"),
        client.get("/branches"),
        client.get("/orders"),
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

      if (nextBranchId) {
        await fetchStockForBranch(nextBranchId);
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

    if (!distributorId || !branchId || !productId) {
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
        branchId,
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
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    }
  };

  const renderStatusButtons = (o) => {
    // BRANCH_STAFF: only Cancel a PENDING order
    if (isBranchStaff) {
      if (o.status === "PENDING") {
        return (
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => updateStatus(o.id, "CANCELLED")}
          >
            Cancel
          </button>
        );
      }
      return <span className="text-muted">—</span>;
    }

    // Admin/Manager/Inventory: full workflow
    if (o.status === "PENDING") {
      return (
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() => updateStatus(o.id, "APPROVED")}
          >
            Approve
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
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
          onClick={() => updateStatus(o.id, "DELIVERED")}
        >
          Delivered
        </button>
      );
    }

    return <span className="text-muted">—</span>;
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Orders</h4>
          <span className="text-muted small">
            Role: <strong>{role || "-"}</strong>
          </span>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Create Order (1 item)</h6>

            <form onSubmit={createOrder} className="row g-2">
              <div className="col-md-3">
                <select
                  className="form-select"
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

              <div className="col-md-3">
                <select
                  className="form-select"
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
              </div>

              <div className="col-md-4">
                <select
                  className="form-select"
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

              <div className="col-md-1">
                <input
                  className={`form-control ${quantity && !qtyValid ? "is-invalid" : ""}`}
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={!productId || availableQty <= 0 || loadingStock}
                />
                {quantity && !qtyValid ? (
                  <div className="invalid-feedback">Max {availableQty}</div>
                ) : null}
              </div>

              <div className="col-md-1">
                <button className="btn btn-primary w-100" disabled={!canCreate}>
                  Create
                </button>
              </div>

              <div className="col-12">
                <div className="small text-muted">
                  Available: <strong>{productId ? availableQty : "-"}</strong>
                  {"  "} | Unit Price: <strong>{unitPrice ? `৳${unitPrice}` : "-"}</strong>
                  {"  "} | Preview Total: <strong>{qtyValid ? `৳${previewTotal}` : "-"}</strong>
                </div>
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
                  <th>Distributor</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.code || "-"}</td>
                    <td>{o.distributor?.name || "-"}</td>
                    <td>{o.branch?.name || "-"}</td>
                    <td>{o.status}</td>
                    <td>{o.totalAmount}</td>
                    <td>
                      {o.items?.map((it) => (
                        <div key={it.id}>
                          {it.product?.name} x {it.quantity} (@{it.unitPrice})
                        </div>
                      ))}
                    </td>
                    <td>{renderStatusButtons(o)}</td>
                  </tr>
                ))}

                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No orders found
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