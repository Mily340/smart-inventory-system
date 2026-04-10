import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Reports() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("lowStock"); // lowStock | stockTx | orders | transfers
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [data, setData] = useState([]);

  const fetchBranches = async () => {
    try {
      const res = await client.get("/branches");
      const b = res.data?.data || [];
      setBranches(b);
      if (!branchId && b.length > 0) setBranchId(b[0].id);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runReport = async () => {
    setError("");
    setLoading(true);
    setData([]);

    try {
      let url = "";
      const q = new URLSearchParams();

      if (branchId) q.set("branchId", branchId);
      if (status) q.set("status", status);
      if (from) q.set("from", from);
      if (to) q.set("to", to);

      if (tab === "lowStock") {
        url = `/reports/low-stock${q.toString() ? `?${q}` : ""}`;
      } else if (tab === "stockTx") {
        url = `/reports/stock-transactions${q.toString() ? `?${q}` : ""}`;
      } else if (tab === "orders") {
        url = `/reports/orders${q.toString() ? `?${q}` : ""}`;
      } else if (tab === "transfers") {
        url = `/reports/transfers${q.toString() ? `?${q}` : ""}`;
      }

      const res = await client.get(url);
      setData(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load report";
      setError(msg);
      if (msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const StatusSelect = () => {
    if (tab === "orders") {
      return (
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PACKED">PACKED</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      );
    }
    if (tab === "transfers") {
      return (
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="DISPATCHED">DISPATCHED</option>
          <option value="RECEIVED">RECEIVED</option>
        </select>
      );
    }
    return (
      <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} disabled>
        <option value="">No status filter</option>
      </select>
    );
  };

  const showStatusFilter = tab === "orders" || tab === "transfers";

  return (
    <>
      <NavBar />
      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Reports</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex gap-2 flex-wrap mb-3">
              <button
                className={`btn btn-sm ${tab === "lowStock" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setTab("lowStock")}
              >
                Low Stock
              </button>
              <button
                className={`btn btn-sm ${tab === "stockTx" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setTab("stockTx")}
              >
                Stock Transactions
              </button>
              <button
                className={`btn btn-sm ${tab === "orders" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setTab("orders")}
              >
                Orders
              </button>
              <button
                className={`btn btn-sm ${tab === "transfers" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setTab("transfers")}
              >
                Transfers
              </button>
            </div>

            <div className="row g-2">
              <div className="col-md-4">
                <select className="form-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>

              <div className="col-md-2">
                <input className="form-control" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              <div className="col-md-2">{showStatusFilter ? <StatusSelect /> : <StatusSelect />}</div>

              <div className="col-md-2">
                <button className="btn btn-success w-100" onClick={runReport}>
                  Run
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading ? <div>Loading...</div> : null}

        {!loading && tab === "lowStock" ? (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Reorder Level</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <td>{r.branch?.name}</td>
                    <td>{r.product?.name}</td>
                    <td>{r.quantity}</td>
                    <td>{r.reorderLevel}</td>
                  </tr>
                ))}
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No data
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && tab === "stockTx" ? (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.branch?.name}</td>
                    <td>{t.product?.name}</td>
                    <td>{t.type}</td>
                    <td>{t.quantity}</td>
                    <td>{t.user?.fullName || "-"}</td>
                  </tr>
                ))}
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No data
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && tab === "orders" ? (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Distributor</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id}>
                    <td>{o.code || "-"}</td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td>{o.branch?.name}</td>
                    <td>{o.distributor?.name}</td>
                    <td>{o.status}</td>
                    <td>{o.totalAmount}</td>
                  </tr>
                ))}
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No data
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}

        {!loading && tab === "transfers" ? (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.fromBranch?.name}</td>
                    <td>{t.toBranch?.name}</td>
                    <td>{t.status}</td>
                    <td>
                      {t.items?.map((it) => (
                        <div key={it.id}>
                          {it.product?.name} x {it.quantity}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No data
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </>
  );
}