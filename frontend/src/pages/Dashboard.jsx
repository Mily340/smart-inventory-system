// frontend/src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import client from "../api/client";
import NavBar from "../components/NavBar";

const PASTEL = [
  "#A7C7E7",
  "#B7E4C7",
  "#FFD6A5",
  "#E4C1F9",
  "#FFADAD",
  "#CAFFBF",
  "#BDE0FE",
  "#FFC8DD",
];

const orderStatuses = ["PENDING", "APPROVED", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED"];
const transferStatuses = ["PENDING", "APPROVED", "REJECTED", "DISPATCHED", "RECEIVED"];
const deliveryStatuses = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [kpis, setKpis] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    pendingDeliveries: 0,
  });

  const [activity, setActivity] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [chartTab, setChartTab] = useState("orders");

  const fmtTime = (iso) => {
    if (!iso) return "—";

    try {
      return new Date(iso).toLocaleString();
    } catch {
      return "—";
    }
  };

  const normalizeOrders = (list = []) =>
    list.map((o) => ({
      type: "Order",
      badge: "bg-light text-dark border",
      detail: `${o.code || o.id} • ${o.status || "—"} • Total: ${o.totalAmount ?? "—"}`,
      time: o.createdAt || o.updatedAt,
    }));

  const normalizeTransfers = (list = []) =>
    list.map((t) => ({
      type: "Transfer",
      badge: "bg-light text-dark border",
      detail: `${t.id?.slice(0, 8)} • ${t.status || "—"} • ${t.fromBranch?.code || ""} → ${
        t.toBranch?.code || ""
      }`,
      time: t.createdAt || t.updatedAt,
    }));

  const normalizeNotifications = (list = []) =>
    list.map((n) => ({
      type: "Notification",
      badge: "bg-light text-dark border",
      detail: `${n.title || "Notification"} • ${n.message || ""}`.trim(),
      time: n.createdAt,
    }));

  const loadDashboard = async () => {
    setErr("");
    setLoading(true);

    try {
      const reqs = [
        client.get("/products"),
        client.get("/orders"),
        client.get("/deliveries"),
        client.get("/notifications"),
        client.get("/transfers"),
        client.get("/reports/low-stock").catch(() => ({ data: { data: [] } })),
      ];

      const [productsRes, ordersRes, deliveriesRes, notificationsRes, transfersRes, lowStockRes] =
        await Promise.all(reqs);

      const products = productsRes?.data?.data || [];
      const _orders = ordersRes?.data?.data || [];
      const _deliveries = deliveriesRes?.data?.data || [];
      const notifications = notificationsRes?.data?.data || [];
      const _transfers = transfersRes?.data?.data || [];
      const _lowStock = lowStockRes?.data?.data || [];

      setOrders(_orders);
      setTransfers(_transfers);
      setDeliveries(_deliveries);
      setLowStock(_lowStock);

      const pendingOrders = _orders.filter((o) => o.status === "PENDING").length;
      const pendingDeliveries = _deliveries.filter((d) => d.status === "ASSIGNED").length;

      setKpis({
        totalProducts: products.length,
        lowStockItems: _lowStock.length,
        pendingOrders,
        pendingDeliveries,
      });

      const merged = [
        ...normalizeOrders(_orders),
        ...normalizeTransfers(_transfers),
        ...normalizeNotifications(notifications),
      ]
        .filter((x) => x.time)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 12);

      setActivity(merged);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load dashboard data";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpiCards = useMemo(
    () => [
      {
        title: "Total Products",
        value: kpis.totalProducts,
        icon: "bi-box-seam",
        hint: "from Products",
        pastel: "rgba(186, 230, 253, 0.55)",
      },
      {
        title: "Low Stock Items",
        value: kpis.lowStockItems,
        icon: "bi-exclamation-triangle",
        hint: "from Reports → Low Stock",
        pastel: "rgba(254, 215, 170, 0.55)",
      },
      {
        title: "Pending Orders",
        value: kpis.pendingOrders,
        icon: "bi-receipt",
        hint: "status = PENDING",
        pastel: "rgba(221, 214, 254, 0.55)",
      },
      {
        title: "Pending Deliveries",
        value: kpis.pendingDeliveries,
        icon: "bi-truck",
        hint: "status = ASSIGNED",
        pastel: "rgba(187, 247, 208, 0.55)",
      },
    ],
    [kpis]
  );

  const ordersByStatus = useMemo(() => {
    const map = new Map(orderStatuses.map((s) => [s, 0]));

    for (const o of orders) {
      map.set(o.status || "PENDING", (map.get(o.status || "PENDING") || 0) + 1);
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const transfersByStatus = useMemo(() => {
    const map = new Map(transferStatuses.map((s) => [s, 0]));

    for (const t of transfers) {
      map.set(t.status || "PENDING", (map.get(t.status || "PENDING") || 0) + 1);
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transfers]);

  const deliveriesByStatus = useMemo(() => {
    const map = new Map(deliveryStatuses.map((s) => [s, 0]));

    for (const d of deliveries) {
      map.set(d.status || "ASSIGNED", (map.get(d.status || "ASSIGNED") || 0) + 1);
    }

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [deliveries]);

  const lowStockByBranch = useMemo(() => {
    const map = new Map();

    for (const x of lowStock) {
      const key = x?.branch?.code
        ? `${x.branch.code} - ${x.branch.name || ""}`.trim()
        : x?.branchId || "Unknown Branch";

      map.set(key, (map.get(key) || 0) + 1);
    }

    const arr = Array.from(map.entries()).map(([branch, count]) => ({ branch, count }));
    arr.sort((a, b) => b.count - a.count);

    return arr.slice(0, 8);
  }, [lowStock]);

  const hasAnyData = (arr) => arr?.some((x) => (x.value ?? x.count ?? 0) > 0);

  const pageWrapStyle = {
    padding: "24px 28px 32px",
    background: "linear-gradient(180deg, #f7fbff 0%, #ffffff 62%)",
    minHeight: "calc(100vh - 54px)",
  };

  const panelStyle = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.28)",
    boxShadow: "0 10px 26px rgba(15,23,42,.06)",
  };

  return (
    <>
      <NavBar />

      <main style={pageWrapStyle}>
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, color: "#1f2a44" }}>
              Dashboard
            </h2>
            <div className="text-muted">Quick overview using live system data.</div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={loadDashboard}
            disabled={loading}
            style={{
              borderRadius: 12,
              fontWeight: 700,
              padding: "8px 14px",
              background: "rgba(255,255,255,.85)",
            }}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise me-1" />
            Refresh
          </button>
        </div>

        {err ? (
          <div className="alert alert-danger" style={{ borderRadius: 14 }}>
            {err}
          </div>
        ) : null}

        <div className="row g-3 mb-4">
          {kpiCards.map((c) => (
            <KpiCard
              key={c.title}
              title={c.title}
              value={loading ? "…" : c.value}
              icon={c.icon}
              hint={c.hint}
              pastel={c.pastel}
            />
          ))}
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="card border-0" style={panelStyle}>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-2">
                  <h5 className="m-0" style={{ fontWeight: 900 }}>
                    Analytics
                  </h5>

                  <span className="badge text-bg-light border">
                    <i className="bi bi-calendar3 me-1" />
                    Live
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2 mb-2">
                  <TabBtn active={chartTab === "orders"} onClick={() => setChartTab("orders")}>
                    Orders
                  </TabBtn>
                  <TabBtn active={chartTab === "transfers"} onClick={() => setChartTab("transfers")}>
                    Transfers
                  </TabBtn>
                  <TabBtn active={chartTab === "stock"} onClick={() => setChartTab("stock")}>
                    Low Stock
                  </TabBtn>
                  <TabBtn active={chartTab === "deliveries"} onClick={() => setChartTab("deliveries")}>
                    Deliveries
                  </TabBtn>
                </div>

                <div
                  className="rounded-4 border p-2"
                  style={{
                    height: 320,
                    background:
                      "linear-gradient(180deg, rgba(186, 230, 253, 0.30) 0%, rgba(255, 255, 255, 1) 70%)",
                  }}
                >
                  {loading ? (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                      Loading charts…
                    </div>
                  ) : chartTab === "orders" ? (
                    hasAnyData(ordersByStatus) ? (
                      <div className="h-100">
                        <div className="small text-muted px-2 pt-1">Distribution by order status</div>
                        <ResponsiveContainer width="100%" height="92%">
                          <PieChart>
                            <Tooltip content={<SoftTooltip />} />
                            <Legend verticalAlign="bottom" height={24} />
                            <Pie
                              data={ordersByStatus}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={95}
                              paddingAngle={2}
                            >
                              {ordersByStatus.map((_, i) => (
                                <Cell key={i} fill={PASTEL[i % PASTEL.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyChart />
                    )
                  ) : chartTab === "transfers" ? (
                    hasAnyData(transfersByStatus) ? (
                      <div className="h-100">
                        <div className="small text-muted px-2 pt-1">Count by transfer status</div>
                        <ResponsiveContainer width="100%" height="92%">
                          <BarChart data={transfersByStatus} margin={{ top: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip content={<SoftTooltip />} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {transfersByStatus.map((_, i) => (
                                <Cell key={i} fill={PASTEL[i % PASTEL.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyChart />
                    )
                  ) : chartTab === "stock" ? (
                    lowStockByBranch.length ? (
                      <div className="h-100">
                        <div className="small text-muted px-2 pt-1">
                          Low-stock items per branch
                        </div>
                        <ResponsiveContainer width="100%" height="92%">
                          <BarChart data={lowStockByBranch} margin={{ top: 10, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="branch"
                              tick={{ fontSize: 10 }}
                              interval={0}
                              angle={-12}
                              height={48}
                            />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip content={<SoftTooltip />} />
                            <Bar dataKey="count" fill={PASTEL[1]} radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyChart />
                    )
                  ) : hasAnyData(deliveriesByStatus) ? (
                    <div className="h-100">
                      <div className="small text-muted px-2 pt-1">
                        Delivery status distribution
                      </div>
                      <ResponsiveContainer width="100%" height="92%">
                        <PieChart>
                          <Tooltip content={<SoftTooltip />} />
                          <Legend verticalAlign="bottom" height={24} />
                          <Pie
                            data={deliveriesByStatus}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={2}
                          >
                            {deliveriesByStatus.map((_, i) => (
                              <Cell key={i} fill={PASTEL[(i + 2) % PASTEL.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyChart />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 mb-3" style={panelStyle}>
              <div className="card-body">
                <h5 className="m-0 mb-2" style={{ fontWeight: 900 }}>
                  Summary
                </h5>

                <div className="small text-muted">
                  <div className="d-flex justify-content-between py-1">
                    <span>Total Products</span>
                    <span className="fw-semibold">{loading ? "…" : kpis.totalProducts}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Low Stock</span>
                    <span className="fw-semibold">{loading ? "…" : kpis.lowStockItems}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Pending Orders</span>
                    <span className="fw-semibold">{loading ? "…" : kpis.pendingOrders}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span>Pending Deliveries</span>
                    <span className="fw-semibold">{loading ? "…" : kpis.pendingDeliveries}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0" style={panelStyle}>
              <div className="card-body">
                <h5 className="m-0 mb-2" style={{ fontWeight: 900 }}>
                  Notes
                </h5>

                <ul className="m-0 text-muted small">
                  <li>Charts use live API data.</li>
                  <li>Use the tabs to switch analytics.</li>
                  <li>Low Stock depends on Reports → Low Stock endpoint.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 mt-4" style={panelStyle}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="m-0" style={{ fontWeight: 900 }}>
                Recent Activity
              </h5>

              <span className="small text-muted">
                {loading ? "Loading…" : `${activity.length} items`}
              </span>
            </div>

            {loading ? (
              <div className="text-muted">Loading activity…</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>Type</th>
                      <th>Details</th>
                      <th style={{ width: 220 }}>Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {activity.length ? (
                      activity.map((a, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className={`badge ${a.badge}`}>{a.type}</span>
                          </td>
                          <td className="text-muted">{a.detail}</td>
                          <td className="text-muted">{fmtTime(a.time)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-muted">
                          No recent activity found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function KpiCard({ title, value, icon, hint, pastel }) {
  return (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className="card border-0 h-100"
        style={{
          borderRadius: 18,
          boxShadow: "0 10px 26px rgba(15,23,42,.06)",
          border: "1px solid rgba(148,163,184,.28)",
        }}
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="text-muted small">{title}</div>
              <div className="fs-3 fw-bold">{value}</div>
            </div>

            <div
              className="rounded-4 d-flex align-items-center justify-content-center"
              style={{
                width: 42,
                height: 42,
                background: pastel,
                border: "1px solid rgba(15, 23, 42, 0.08)",
              }}
            >
              <i className={`bi ${icon}`} />
            </div>
          </div>

          <div className="small text-muted mt-2">{hint}</div>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-sm ${active ? "btn-primary" : "btn-outline-secondary"}`}
      style={
        active
          ? {
              borderRadius: 12,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              background: "rgba(221, 214, 254, 0.85)",
              color: "#0f172a",
              fontWeight: 700,
            }
          : {
              borderRadius: 12,
              border: "1px solid rgba(15, 23, 42, 0.10)",
              background: "rgba(255, 255, 255, 0.75)",
              color: "#0f172a",
              fontWeight: 700,
            }
      }
    >
      {children}
    </button>
  );
}

function EmptyChart() {
  return (
    <div className="h-100 d-flex align-items-center justify-content-center text-muted">
      No data to display
    </div>
  );
}

function SoftTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const p = payload[0];
  const name = p?.name ?? label ?? "";
  const value = p?.value ?? "—";

  return (
    <div
      className="p-2 rounded-3 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(15,23,42,0.10)",
        fontSize: 12,
      }}
    >
      <div className="fw-semibold">{String(name)}</div>
      <div className="text-muted">Value: {value}</div>
    </div>
  );
}