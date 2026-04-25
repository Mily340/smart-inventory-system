import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import html2canvas from "html2canvas";
import NavBar from "../components/NavBar";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Reports() {
  const navigate = useNavigate();

  // Pastel palette (soft, readable)
  const CHART_COLORS = [
    "#A7C7E7", // pastel blue
    "#B5EAD7", // pastel mint
    "#FFDAC1", // pastel peach
    "#C7CEEA", // pastel lavender
    "#E2F0CB", // pastel green
    "#FFB7B2", // pastel pink
    "#FBE7C6", // pastel cream
    "#D4A5A5", // dusty rose
  ];

  const [tab, setTab] = useState("lowStock"); // lowStock | stockTx | orders | transfers
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [data, setData] = useState([]);

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
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  const exportChartsPng = async () => {
    try {
      const el = document.getElementById("report-charts");
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `report-${tab}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setError("Failed to export chart image");
    }
  };

  // When switching tabs, clear status filter (only relevant for orders/transfers)
  useEffect(() => {
    if (tab !== "orders" && tab !== "transfers") setStatus("");
  }, [tab]);

  const StatusSelect = () => {
    if (tab === "orders") {
      return (
        <select
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
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
        <select
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
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
      <select className="form-select" value="" disabled>
        <option value="">No status filter</option>
      </select>
    );
  };

  const showStatusFilter = tab === "orders" || tab === "transfers";

  // ---------- Chart Data Builders ----------
  const asDateKey = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || Number.isNaN(dt.getTime())) return "";
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const lowStockBar = useMemo(() => {
    if (tab !== "lowStock") return [];
    return (data || []).map((x) => ({
      name: x.product?.name || x.product?.code || x.productId || "Product",
      qty: Number(x.quantity ?? x.qty ?? 0),
      reorder: Number(x.reorderLevel ?? 0),
    }));
  }, [data, tab]);

  const stockTxByType = useMemo(() => {
    if (tab !== "stockTx") return [];
    const map = new Map();
    (data || []).forEach((t) => {
      const type = t.type || "UNKNOWN";
      map.set(type, (map.get(type) || 0) + 1);
    });
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, [data, tab]);

  const ordersByStatus = useMemo(() => {
    if (tab !== "orders") return [];
    const map = new Map();
    (data || []).forEach((o) => {
      const st = o.status || "UNKNOWN";
      map.set(st, (map.get(st) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [data, tab]);

  const ordersByDayTotal = useMemo(() => {
    if (tab !== "orders") return [];
    const map = new Map();
    (data || []).forEach((o) => {
      const k = asDateKey(o.createdAt);
      if (!k) return;
      const amt = Number(o.totalAmount ?? 0);
      map.set(k, (map.get(k) || 0) + amt);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));
  }, [data, tab]);

  const transfersByStatus = useMemo(() => {
    if (tab !== "transfers") return [];
    const map = new Map();
    (data || []).forEach((t) => {
      const st = t.status || "UNKNOWN";
      map.set(st, (map.get(st) || 0) + 1);
    });
    return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
  }, [data, tab]);

  // ---------- Table Renderers ----------
  const renderTable = () => {
    if (data.length === 0) {
      return (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>No data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-center text-muted">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "lowStock") {
      return (
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
              {data.map((x) => (
                <tr key={x.id || `${x.branchId}-${x.productId}`}>
                  <td>{x.branch?.name || x.branch?.code || "-"}</td>
                  <td>{x.product?.name || x.product?.code || "-"}</td>
                  <td>{x.quantity ?? x.qty ?? "-"}</td>
                  <td>{x.reorderLevel ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "stockTx") {
      return (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Branch</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
                  <td>{t.branch?.name || t.branch?.code || "-"}</td>
                  <td>{t.product?.name || t.product?.code || "-"}</td>
                  <td>{t.type}</td>
                  <td>{t.quantity}</td>
                  <td>{t.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (tab === "orders") {
      return (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Code</th>
                <th>Distributor</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td>{o.code || "-"}</td>
                  <td>{o.distributor?.name || "-"}</td>
                  <td>{o.branch?.name || o.branch?.code || "-"}</td>
                  <td>{o.status}</td>
                  <td>{o.totalAmount}</td>
                  <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td style={{ maxWidth: 220 }} className="text-truncate">
                  {t.id}
                </td>
                <td>{t.fromBranch?.name || t.fromBranch?.code || "-"}</td>
                <td>{t.toBranch?.name || t.toBranch?.code || "-"}</td>
                <td>{t.status}</td>
                <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>
                <td>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ---------- Charts ----------
  const renderCharts = () => {
    if (!data || data.length === 0) return null;

    if (tab === "lowStock") {
      return (
        <div className="row g-3 mb-3">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Low Stock: Qty vs Reorder Level</h6>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lowStockBar}>
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="qty" name="Qty" fill={CHART_COLORS[0]} />
                      <Bar dataKey="reorder" name="Reorder Level" fill={CHART_COLORS[3]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-muted small mt-2">Tip: Hover bars to see exact values.</div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Low Stock Share (by product)</h6>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={lowStockBar} dataKey="qty" nameKey="name" label>
                        {lowStockBar.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "stockTx") {
      return (
        <div className="row g-3 mb-3">
          <div className="col-lg-7">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Stock Transactions Count by Type</h6>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockTxByType}>
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Count" fill={CHART_COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Transaction Types Share</h6>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockTxByType} dataKey="count" nameKey="type" label>
                        {stockTxByType.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "orders") {
      return (
        <div className="row g-3 mb-3">
          <div className="col-lg-5">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Orders by Status</h6>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ordersByStatus} dataKey="count" nameKey="status" label>
                        {ordersByStatus.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card">
              <div className="card-body">
                <h6 className="mb-3">Order Total Amount by Day</h6>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordersByDayTotal}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total Amount" fill={CHART_COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // transfers
    return (
      <div className="row g-3 mb-3">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Transfers by Status</h6>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={transfersByStatus} dataKey="count" nameKey="status" label>
                      {transfersByStatus.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Transfers Count by Status</h6>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={transfersByStatus}>
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Count" fill={CHART_COLORS[4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const canExport = !loading && data.length > 0;

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
                className={`btn btn-sm ${
                  tab === "lowStock" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setTab("lowStock")}
              >
                Low Stock
              </button>
              <button
                className={`btn btn-sm ${
                  tab === "stockTx" ? "btn-primary" : "btn-outline-primary"
                }`}
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
                className={`btn btn-sm ${
                  tab === "transfers" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setTab("transfers")}
              >
                Transfers
              </button>
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Branch</label>
                <select
                  className="form-select"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
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
                <label className="form-label small text-muted mb-1">From</label>
                <input
                  className="form-control"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small text-muted mb-1">To</label>
                <input
                  className="form-control"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small text-muted mb-1">Status</label>
                {showStatusFilter ? <StatusSelect /> : <StatusSelect />}
              </div>

              <div className="col-md-2 d-grid gap-2">
                <button className="btn btn-success" onClick={runReport} disabled={loading}>
                  {loading ? "Running..." : "Run"}
                </button>

                <button
                  className="btn btn-outline-primary"
                  onClick={exportChartsPng}
                  disabled={!canExport}
                  title={!canExport ? "Run report first" : "Export charts as PNG"}
                >
                  Export PNG
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Charts (export uses this container) */}
        <div id="report-charts">{renderCharts()}</div>

        {/* Table */}
        {loading ? <div>Loading...</div> : renderTable()}
      </div>
    </>
  );
}