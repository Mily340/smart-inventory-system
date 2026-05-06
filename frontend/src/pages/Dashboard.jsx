// frontend/src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const roleLabel = (role) => {
  const map = {
    SUPER_ADMIN: "System Administrator",
    BRANCH_MANAGER: "Branch Manager",
    INVENTORY_OFFICER: "Inventory Officer",
    BRANCH_STAFF: "Branch Staff",
    DELIVERY_RIDER: "Delivery Rider",
  };

  return map[role] || role || "User";
};

const statusBadgeStyle = (status) => {
  const s = String(status || "").toUpperCase();

  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const map = {
    PENDING: { background: "#FFF7ED", color: "#9A3412", borderColor: "#FED7AA" },
    APPROVED: { background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" },
    PACKED: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    DISPATCHED: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    DELIVERED: { background: "#ECFEFF", color: "#0E7490", borderColor: "#A5F3FC" },
    CANCELLED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    REJECTED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    RECEIVED: { background: "#ECFDF5", color: "#047857", borderColor: "#A7F3D0" },
    ASSIGNED: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    IN_TRANSIT: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    PICKED_UP: { background: "#FFF7ED", color: "#9A3412", borderColor: "#FED7AA" },
    LOW: { background: "#FFF7ED", color: "#C2410C", borderColor: "#FED7AA" },
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

const fmtTime = (iso) => {
  if (!iso) return "—";

  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const money = (value) => `৳${Number(value || 0).toLocaleString()}`;

export default function Dashboard() {
  const navigate = useNavigate();

  const role = sessionStorage.getItem("role") || "";

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

  const normalizeOrders = (list = []) =>
    list.map((o) => ({
      type: "Order",
      status: o.status || "PENDING",
      detail: `${o.code || o.id} • ${o.distributor?.name || "Distributor"} • ${money(
        o.totalAmount
      )}`,
      time: o.createdAt || o.updatedAt,
    }));

  const normalizeTransfers = (list = []) =>
    list.map((t) => ({
      type: "Transfer",
      status: t.status || "PENDING",
      detail: `${t.fromBranch?.code || "From"} → ${t.toBranch?.code || "To"}`,
      time: t.createdAt || t.updatedAt,
    }));

  const normalizeNotifications = (list = []) =>
    list.map((n) => ({
      type: "Notification",
      status: n.isRead ? "READ" : "NEW",
      detail: `${n.title || "Notification"} • ${n.message || ""}`.trim(),
      time: n.createdAt,
    }));

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
        .slice(0, 8);

      setActivity(merged);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load dashboard data";
      setErr(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpiCards = useMemo(
    () => [
      {
        title: "Total Products",
        value: kpis.totalProducts,
        icon: "bi-box-seam",
        hint: "Active catalog items",
        pastel: "rgba(186, 230, 253, 0.55)",
      },
      {
        title: "Low Stock Items",
        value: kpis.lowStockItems,
        icon: "bi-exclamation-triangle",
        hint: "Below reorder level",
        pastel: "rgba(254, 215, 170, 0.55)",
      },
      {
        title: "Pending Orders",
        value: kpis.pendingOrders,
        icon: "bi-receipt",
        hint: "Awaiting approval",
        pastel: "rgba(221, 214, 254, 0.55)",
      },
      {
        title: "Pending Deliveries",
        value: kpis.pendingDeliveries,
        icon: "bi-truck",
        hint: "Assigned to riders",
        pastel: "rgba(187, 247, 208, 0.55)",
      },
    ],
    [kpis]
  );

  const quickActions = useMemo(() => {
    if (role === "SUPER_ADMIN") {
      return [
        { label: "Manage Users", path: "/admin/users", icon: "bi-people" },
        { label: "Products", path: "/products", icon: "bi-box-seam" },
        { label: "Inventory", path: "/inventory", icon: "bi-archive" },
        { label: "Reports", path: "/reports", icon: "bi-graph-up" },
      ];
    }

    if (role === "BRANCH_MANAGER") {
      return [
        { label: "Branch Stock", path: "/branch-stock", icon: "bi-boxes" },
        { label: "Orders", path: "/orders", icon: "bi-receipt" },
        { label: "Transfers", path: "/transfers", icon: "bi-truck" },
        { label: "Reports", path: "/reports", icon: "bi-graph-up" },
      ];
    }

    if (role === "INVENTORY_OFFICER") {
      return [
        { label: "Products", path: "/products", icon: "bi-box-seam" },
        { label: "Inventory", path: "/inventory", icon: "bi-archive" },
        { label: "Transfers", path: "/transfers", icon: "bi-truck" },
        { label: "Reports", path: "/reports", icon: "bi-graph-up" },
      ];
    }

    return [
      { label: "Orders", path: "/orders", icon: "bi-receipt" },
      { label: "Branch Stock", path: "/branch-stock", icon: "bi-boxes" },
      { label: "Notifications", path: "/notifications", icon: "bi-bell" },
    ];
  }, [role]);

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

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const recentTransfers = useMemo(() => transfers.slice(0, 5), [transfers]);
  const recentLowStock = useMemo(() => lowStock.slice(0, 5), [lowStock]);

  const pageWrapStyle = {
    marginTop: 18,
    paddingBottom: 26,
  };

  const panelStyle = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.35)",
    boxShadow: "0 10px 26px rgba(15,23,42,.06)",
    overflow: "hidden",
    background: "rgba(255,255,255,.9)",
  };

  const headerCardStyle = {
    background: "linear-gradient(180deg, rgba(219,234,254,.55), rgba(255,255,255,1))",
    borderBottom: "1px solid rgba(148,163,184,.25)",
  };

  return (
    <>
      <NavBar />

      <main className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-end mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Dashboard
            </h2>

            <div className="text-muted" style={{ marginTop: 4 }}>
              Quick overview using live system data.
              {role ? (
                <span>
                  {" "}
                  Logged in as <strong>{roleLabel(role)}</strong>.
                </span>
              ) : null}
            </div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={loadDashboard}
            disabled={loading}
            style={{
              borderRadius: 10,
              fontWeight: 700,
              padding: "8px 14px",
              background: "rgba(255,255,255,.85)",
            }}
            title="Refresh"
          >
            <i className="bi bi-arrow-clockwise me-1" />
            {loading ? "Refreshing..." : "Refresh"}
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

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Quick Actions
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Fast access to the most used modules for your role.
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
                {roleLabel(role)}
              </span>
            </div>
          </div>

          <div className="card-body">
            <div className="row g-2">
              {quickActions.map((a) => (
                <div className="col-12 col-sm-6 col-xl-3" key={a.path}>
                  <button
                    className="btn w-100 text-start"
                    onClick={() => navigate(a.path)}
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(148,163,184,.28)",
                      background: "rgba(248,250,252,.85)",
                      fontWeight: 800,
                      padding: "12px 14px",
                    }}
                  >
                    <i className={`bi ${a.icon} me-2 text-primary`}></i>
                    {a.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-xl-8">
            <div className="card" style={panelStyle}>
              <div className="card-body" style={headerCardStyle}>
                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                      Analytics
                    </div>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      Live distribution based on operational data.
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
                      fontWeight: 800,
                    }}
                  >
                    <i className="bi bi-calendar3 me-1" />
                    Live
                  </span>
                </div>
              </div>

              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 mb-3">
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
                    height: 280,
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
                              innerRadius={50}
                              outerRadius={82}
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
                            innerRadius={50}
                            outerRadius={82}
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

          <div className="col-12 col-xl-4">
            <div className="card mb-3" style={panelStyle}>
              <div className="card-body" style={headerCardStyle}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Summary
                </div>
              </div>

              <div className="card-body">
                <SummaryLine label="Total Products" value={loading ? "…" : kpis.totalProducts} />
                <SummaryLine label="Low Stock" value={loading ? "…" : kpis.lowStockItems} />
                <SummaryLine label="Pending Orders" value={loading ? "…" : kpis.pendingOrders} />
                <SummaryLine
                  label="Pending Deliveries"
                  value={loading ? "…" : kpis.pendingDeliveries}
                />
              </div>
            </div>

            <div className="card" style={panelStyle}>
              <div className="card-body" style={headerCardStyle}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Notes
                </div>
              </div>

              <div className="card-body">
                <ul className="m-0 text-muted" style={{ fontSize: 13, paddingLeft: 18 }}>
                  <li>Charts use live API data.</li>
                  <li>Low stock is calculated from reorder level.</li>
                  <li>Refresh after changing orders, stock, or transfers.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mt-1">
          <RecentOrders orders={recentOrders} loading={loading} />
          <RecentTransfers transfers={recentTransfers} loading={loading} />
          <RecentLowStock lowStock={recentLowStock} loading={loading} />
        </div>

        <div className="card mt-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex justify-content-between align-items-center">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Recent Activity
              </div>

              <span className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading…" : `${activity.length} item(s)`}
              </span>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading activity…</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 130 }}>Type</th>
                      <th>Details</th>
                      <th style={{ width: 140 }}>Status</th>
                      <th style={{ width: 170 }}>Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {activity.length ? (
                      activity.map((a, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800 }}>{a.type}</td>
                          <td className="text-muted">{a.detail}</td>
                          <td>
                            <span style={statusBadgeStyle(a.status)}>{a.status}</span>
                          </td>
                          <td className="text-muted">{fmtTime(a.time)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
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
    <div className="col-12 col-sm-6 col-xl-3">
      <div
        className="h-100 p-3"
        style={{
          borderRadius: 18,
          boxShadow: "0 10px 26px rgba(15,23,42,.06)",
          border: "1px solid rgba(148,163,184,.28)",
          background: "rgba(255,255,255,.9)",
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div className="text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {title}
            </div>

            <div style={{ fontSize: 30, fontWeight: 900, color: "#0F172A" }}>
              {value}
            </div>

            <div className="text-muted" style={{ fontSize: 12 }}>
              {hint}
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: pastel,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              flex: "0 0 auto",
            }}
          >
            <i className={`bi ${icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
      <span className="text-muted" style={{ fontSize: 14 }}>
        {label}
      </span>

      <span style={{ fontWeight: 900, color: "#0F172A" }}>{value}</span>
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
              borderRadius: 999,
              border: "1px solid rgba(15, 23, 42, 0.08)",
              background: "rgba(221, 214, 254, 0.85)",
              color: "#0f172a",
              fontWeight: 800,
              padding: "7px 13px",
            }
          : {
              borderRadius: 999,
              border: "1px solid rgba(15, 23, 42, 0.10)",
              background: "rgba(255, 255, 255, 0.75)",
              color: "#0f172a",
              fontWeight: 800,
              padding: "7px 13px",
            }
      }
    >
      {children}
    </button>
  );
}

function RecentOrders({ orders, loading }) {
  return (
    <SmallListCard
      title="Recent Orders"
      icon="bi-receipt"
      loading={loading}
      emptyText="No recent orders"
      rows={orders.map((o) => ({
        key: o.id,
        title: `${o.code || "Order"} • ${o.distributor?.name || "Distributor"}`,
        subtitle: `${o.branch?.name || "Branch"} • ${money(o.totalAmount)}`,
        badge: o.status || "PENDING",
      }))}
    />
  );
}

function RecentTransfers({ transfers, loading }) {
  return (
    <SmallListCard
      title="Recent Transfers"
      icon="bi-truck"
      loading={loading}
      emptyText="No recent transfers"
      rows={transfers.map((t) => ({
        key: t.id,
        title: `${t.fromBranch?.code || "From"} → ${t.toBranch?.code || "To"}`,
        subtitle: `${t.fromBranch?.name || "-"} to ${t.toBranch?.name || "-"}`,
        badge: t.status || "PENDING",
      }))}
    />
  );
}

function RecentLowStock({ lowStock, loading }) {
  return (
    <SmallListCard
      title="Recent Low Stock"
      icon="bi-exclamation-triangle"
      loading={loading}
      emptyText="No low stock items"
      rows={lowStock.map((x) => ({
        key: x.id,
        title: `${x.product?.code || "-"} • ${x.product?.name || "Product"}`,
        subtitle: `${x.branch?.name || "Branch"} • Qty ${x.quantity || 0} / Reorder ${
          x.reorderLevel || 0
        }`,
        badge: "LOW",
      }))}
    />
  );
}

function SmallListCard({ title, icon, loading, emptyText, rows }) {
  return (
    <div className="col-12 col-xl-4">
      <div
        className="card h-100"
        style={{
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,.35)",
          boxShadow: "0 10px 26px rgba(15,23,42,.06)",
          overflow: "hidden",
          background: "rgba(255,255,255,.9)",
        }}
      >
        <div
          className="card-body"
          style={{
            background: "linear-gradient(180deg, rgba(219,234,254,.55), rgba(255,255,255,1))",
            borderBottom: "1px solid rgba(148,163,184,.25)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
            <i className={`bi ${icon} me-2 text-primary`}></i>
            {title}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-muted">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-muted">{emptyText}</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="d-flex justify-content-between align-items-start gap-2"
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(148,163,184,.25)",
                    background: "rgba(248,250,252,.7)",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 900,
                        color: "#0F172A",
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 240,
                      }}
                    >
                      {r.title}
                    </div>

                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {r.subtitle}
                    </div>
                  </div>

                  <span style={statusBadgeStyle(r.badge)}>{r.badge}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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