// frontend/src/pages/Notifications.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const typeStyle = (type) => {
  const t = String(type || "").toUpperCase();

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const map = {
    TRANSFER_STATUS: {
      background: "#EFF6FF",
      color: "#1D4ED8",
      borderColor: "#BFDBFE",
      icon: "bi-truck",
      label: "Transfer",
    },
    LOW_STOCK: {
      background: "#FFF7ED",
      color: "#C2410C",
      borderColor: "#FED7AA",
      icon: "bi-exclamation-triangle",
      label: "Low Stock",
    },
    ORDER_STATUS: {
      background: "#F5F3FF",
      color: "#5B21B6",
      borderColor: "#DDD6FE",
      icon: "bi-receipt",
      label: "Order",
    },
    DELIVERY_STATUS: {
      background: "#ECFDF5",
      color: "#047857",
      borderColor: "#A7F3D0",
      icon: "bi-box-seam",
      label: "Delivery",
    },
    GENERAL: {
      background: "#F3F4F6",
      color: "#374151",
      borderColor: "#E5E7EB",
      icon: "bi-bell",
      label: "General",
    },
  };

  return {
    ...base,
    ...(map[t] || {
      background: "#F3F4F6",
      color: "#374151",
      borderColor: "#E5E7EB",
      icon: "bi-bell",
      label: t.replaceAll("_", " ") || "Notification",
    }),
  };
};

const formatDate = (value) => {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Notifications() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await client.get("/notifications");
      setItems(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load notifications";
      setError(msg);

      if (msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("fullName");
        localStorage.removeItem("branchId");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);
  const readCount = useMemo(() => items.filter((n) => n.isRead).length, [items]);

  const filteredItems = useMemo(() => {
    if (filter === "UNREAD") return items.filter((n) => !n.isRead);
    if (filter === "READ") return items.filter((n) => n.isRead);
    return items;
  }, [items, filter]);

  const recentTypeCount = useMemo(() => {
    const unique = new Set(items.map((n) => n.type).filter(Boolean));
    return unique.size;
  }, [items]);

  const markRead = async (id) => {
    setError("");
    setBusyId(id);

    try {
      await client.patch(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark as read");
    } finally {
      setBusyId("");
    }
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

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Notifications
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              Track system alerts, transfer updates, stock alerts, and operational messages.
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
            onClick={fetchNotifications}
            disabled={loading}
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

        <div className="row g-3 mb-4">
          <SummaryCard
            title="Total"
            value={items.length}
            icon="bi-bell"
            hint="All notifications"
          />

          <SummaryCard
            title="Unread"
            value={unreadCount}
            icon="bi-envelope-exclamation"
            hint="Needs attention"
          />

          <SummaryCard
            title="Read"
            value={readCount}
            icon="bi-check2-circle"
            hint="Already reviewed"
          />

          <SummaryCard
            title="Types"
            value={recentTypeCount}
            icon="bi-tags"
            hint="Alert categories"
          />
        </div>

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Notification Filter
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Filter messages by read status.
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
                {filteredItems.length} visible
              </span>
            </div>
          </div>

          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              {[
                { key: "ALL", label: "All" },
                { key: "UNREAD", label: "Unread" },
                { key: "READ", label: "Read" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-outline-primary"}`}
                  style={{
                    borderRadius: 999,
                    fontWeight: 800,
                    padding: "7px 14px",
                  }}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Notification List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${filteredItems.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading notifications...</div>
            ) : filteredItems.length === 0 ? (
              <div
                className="text-center text-muted py-5"
                style={{
                  borderRadius: 16,
                  border: "1px dashed rgba(148,163,184,.5)",
                  background: "rgba(248,250,252,.7)",
                }}
              >
                <i className="bi bi-bell-slash" style={{ fontSize: 28 }}></i>
                <div style={{ marginTop: 8, fontWeight: 700 }}>No notifications found</div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {filteredItems.map((n) => {
                  const badge = typeStyle(n.type);

                  return (
                    <div
                      key={n.id}
                      className="d-flex flex-wrap justify-content-between align-items-start gap-3"
                      style={{
                        borderRadius: 16,
                        border: n.isRead
                          ? "1px solid rgba(148,163,184,.25)"
                          : "1px solid rgba(59,130,246,.22)",
                        background: n.isRead
                          ? "rgba(255,255,255,.72)"
                          : "linear-gradient(180deg, rgba(239,246,255,.9), rgba(255,255,255,.95))",
                        padding: "14px 16px",
                        boxShadow: n.isRead
                          ? "none"
                          : "0 8px 18px rgba(37,99,235,.06)",
                        opacity: n.isRead ? 0.78 : 1,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: "1 1 520px" }}>
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                          <span style={badge}>
                            <i className={`bi ${badge.icon}`}></i>
                            {badge.label}
                          </span>

                          <span style={{ fontWeight: 900, color: "#0F172A" }}>
                            {n.title || "Notification"}
                          </span>

                          {!n.isRead ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "5px 9px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 900,
                                background: "#FEF3C7",
                                color: "#92400E",
                                border: "1px solid #FDE68A",
                              }}
                            >
                              NEW
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 9px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                background: "#F3F4F6",
                                color: "#4B5563",
                                border: "1px solid #E5E7EB",
                              }}
                            >
                              <i className="bi bi-check2-circle"></i>
                              Read
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 15, color: "#1F2937" }}>
                          {n.message || "-"}
                        </div>

                        <div className="text-muted mt-2" style={{ fontSize: 13 }}>
                          <i className="bi bi-clock me-1"></i>
                          {formatDate(n.createdAt)}
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {!n.isRead ? (
                          <button
                            className="btn btn-sm btn-outline-success"
                            style={{
                              borderRadius: 10,
                              fontWeight: 800,
                              padding: "7px 12px",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => markRead(n.id)}
                            disabled={busyId === n.id}
                          >
                            <i className="bi bi-check2 me-1"></i>
                            {busyId === n.id ? "Saving..." : "Mark Read"}
                          </button>
                        ) : (
                          <span
                            className="text-muted"
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              New notifications appear first based on the backend response order.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div
        className="p-3 h-100"
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,.28)",
          boxShadow: "0 8px 18px rgba(15,23,42,.05)",
          background: "rgba(255,255,255,.88)",
        }}
      >
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div className="text-muted" style={{ fontSize: 13, fontWeight: 700 }}>
              {title}
            </div>

            <div style={{ fontSize: 28, fontWeight: 900, color: "#0F172A" }}>
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
              background: "rgba(219,234,254,.55)",
              border: "1px solid rgba(147,197,253,.55)",
              color: "#1D4ED8",
              fontSize: 18,
              flex: "0 0 auto",
            }}
          >
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}