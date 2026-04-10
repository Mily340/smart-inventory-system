import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Orders() {
  const navigate = useNavigate();

  const [distributors, setDistributors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [distributorId, setDistributorId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      const [dRes, bRes, pRes, oRes] = await Promise.all([
        client.get("/distributors"),
        client.get("/branches"),
        client.get("/products"),
        client.get("/orders"),
      ]);

      const d = dRes.data?.data || [];
      const b = bRes.data?.data || [];
      const p = pRes.data?.data || [];
      const o = oRes.data?.data || [];

      setDistributors(d);
      setBranches(b);
      setProducts(p);
      setOrders(o);

      if (!distributorId && d.length > 0) setDistributorId(d[0].id);
      if (!branchId && b.length > 0) setBranchId(b[0].id);
      if (!productId && p.length > 0) setProductId(p[0].id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load orders";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const unitPrice = Number(selectedProduct?.price || 0);

  const qtyNum = useMemo(() => {
    const n = Number(quantity);
    return Number.isInteger(n) ? n : NaN;
  }, [quantity]);

  const canCreate = distributorId && branchId && productId && Number.isInteger(qtyNum) && qtyNum > 0 && unitPrice > 0;

  const previewTotal = useMemo(() => {
    if (!canCreate) return 0;
    return qtyNum * unitPrice;
  }, [canCreate, qtyNum, unitPrice]);

  const createOrder = async (e) => {
    e.preventDefault();
    setError("");

    if (!canCreate) {
      setError("Please select distributor, branch, product and enter a valid quantity.");
      return;
    }

    try {
      await client.post("/orders", {
        distributorId,
        branchId,
        items: [{ productId, quantity: qtyNum }],
      });

      setQuantity("");
      fetchAll();
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
        <h4 className="mb-3">Orders</h4>

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
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ` : ""}
                      {p.name}
                      {p.price ? ` (৳${p.price})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-1">
                <input
                  className="form-control"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-1">
                <button className="btn btn-primary w-100" disabled={!canCreate}>
                  Create
                </button>
              </div>

              <div className="col-12">
                <div className="small text-muted">
                  Unit Price: <strong>{unitPrice ? `৳${unitPrice}` : "-"}</strong>
                  {"  "} | Preview Total:{" "}
                  <strong>{canCreate ? `৳${previewTotal}` : "-"}</strong>
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