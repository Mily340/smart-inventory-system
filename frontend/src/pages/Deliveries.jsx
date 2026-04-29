// frontend/src/pages/Deliveries.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const badgeStyle = (status) => {
  const s = String(status || "").toUpperCase();

  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const map = {
    ASSIGNED: { background: "#FFF7ED", color: "#9A3412", borderColor: "#FED7AA" },
    PICKED_UP: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    IN_TRANSIT: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    DELIVERED: { background: "#ECFDF5", color: "#047857", borderColor: "#A7F3D0" },
    FAILED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    CANCELLED: { background: "#F3F4F6", color: "#374151", borderColor: "#E5E7EB" },
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

const finalIconStyle = (type) => {
  const ok = type === "DELIVERED";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontSize: 17,
    fontWeight: 900,
    border: ok ? "1px solid #A7F3D0" : "1px solid #FECACA",
    background: ok ? "#ECFDF5" : "#FEF2F2",
    color: ok ? "#047857" : "#B91C1C",
  };
};

export default function Deliveries() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);

  const [orderId, setOrderId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = localStorage.getItem("role") || "";

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInventoryOfficer = role === "INVENTORY_OFFICER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const isRider = role === "DELIVERY_RIDER";

  const canCreateDelivery = isSuperAdmin || isInventoryOfficer || isBranchManager;
  const canManageStatus = isSuperAdmin || isInventoryOfficer || isBranchManager || isRider;

  const deliverableOrders = useMemo(() => {
    return orders.filter((o) => ["APPROVED", "PACKED", "DISPATCHED", "DELIVERED"].includes(o.status));
  }, [orders]);

  const handleUnauthorized = (msg) => {
    if (String(msg || "").toLowerCase().includes("unauthorized")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
      localStorage.removeItem("branchId");
      navigate("/login");
      return true;
    }

    return false;
  };

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      const requests = [client.get("/orders"), client.get("/deliveries")];

      if (canCreateDelivery) {
        requests.push(client.get("/users/riders"));
      }

      const responses = await Promise.all(requests);

      const o = responses[0].data?.data || [];
      const d = responses[1].data?.data || [];
      const r = canCreateDelivery ? responses[2].data?.data || [] : [];

      setOrders(o);
      setDeliveries(d);
      setRiders(r);

      const filteredOrders = o.filter((order) =>
        ["APPROVED", "PACKED", "DISPATCHED", "DELIVERED"].includes(order.status)
      );

      if (!orderId && filteredOrders.length > 0) {
        setOrderId(filteredOrders[0].id);
      }

      if (!riderId && r.length > 0) {
        setRiderId(r[0].id);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load deliveries";
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

  const createDelivery = async (e) => {
    e.preventDefault();
    setError("");

    if (!orderId) {
      setError("Please select an order.");
      return;
    }

    if (!riderId) {
      setError("Please select a rider.");
      return;
    }

    try {
      await client.post("/deliveries", {
        orderId,
        riderId,
        destinationAddress,
      });

      setDestinationAddress("");
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create delivery");
    }
  };

  const updateStatus = async (id, status) => {
    setError("");

    try {
      await client.patch(`/deliveries/${id}/status`, { status });
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    }
  };

  const renderStatusButtons = (d) => {
    if (d.status === "DELIVERED") {
      return (
        <span style={finalIconStyle("DELIVERED")} title="Delivered">
          <i className="bi bi-check-lg"></i>
        </span>
      );
    }

    if (d.status === "FAILED" || d.status === "CANCELLED") {
      return (
        <span style={finalIconStyle("FAILED")} title={d.status}>
          <i className="bi bi-x-lg"></i>
        </span>
      );
    }

    if (!canManageStatus) {
      return <span className="text-muted">—</span>;
    }

    if (d.status === "ASSIGNED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => updateStatus(d.id, "PICKED_UP")}
        >
          Picked Up
        </button>
      );
    }

    if (d.status === "PICKED_UP") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => updateStatus(d.id, "IN_TRANSIT")}
        >
          In Transit
        </button>
      );
    }

    if (d.status === "IN_TRANSIT") {
      return (
        <button
          className="btn btn-sm btn-outline-success"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => updateStatus(d.id, "DELIVERED")}
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

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Deliveries
            </h2>

            <div className="text-muted" style={{ marginTop: 4 }}>
              Assign riders and track delivery workflow.
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
            title="Refresh"
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

        {canCreateDelivery ? (
          <div className="card mb-4" style={panelStyle}>
            <div className="card-body" style={headerCardStyle}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                    Create Delivery
                  </div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Select an order, assign a rider, and enter the destination address.
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
                  Rider dropdown enabled
                </span>
              </div>
            </div>

            <div className="card-body">
              <form onSubmit={createDelivery} className="row g-2 align-items-end">
                <div className="col-12 col-md-4">
                  <label className="form-label small text-muted mb-1">Order</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: 12 }}
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  >
                    {deliverableOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code ? `${o.code} - ` : ""}
                        {o.distributor?.name || "Distributor"} ({o.status})
                      </option>
                    ))}
                  </select>

                  <div className="form-text">
                    {deliverableOrders.length === 0 ? "No deliverable orders available." : null}
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted mb-1">Rider</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: 12 }}
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    required
                  >
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code ? `${r.code} - ` : ""}
                        {r.fullName}
                        {r.branch?.name ? ` (${r.branch.name})` : ""}
                      </option>
                    ))}
                  </select>

                  <div className="form-text">
                    {riders.length === 0 ? "No delivery riders found." : null}
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small text-muted mb-1">Destination</label>
                  <input
                    className="form-control"
                    style={{ borderRadius: 12 }}
                    placeholder="Destination Address"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-1 d-grid">
                  <button
                    className="btn btn-primary"
                    style={{
                      borderRadius: 12,
                      fontWeight: 800,
                      padding: "10px 12px",
                      whiteSpace: "nowrap",
                    }}
                    disabled={!orderId || !riderId}
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Recent Deliveries
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${deliveries.length} record(s)`}
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
                      <th style={{ width: 110 }}>Code</th>
                      <th style={{ width: 110 }}>Order</th>
                      <th style={{ minWidth: 170 }}>Rider</th>
                      <th style={{ width: 140 }}>Status</th>
                      <th style={{ minWidth: 220 }}>Destination</th>
                      <th style={{ minWidth: 170 }}>Latest Location</th>
                      <th style={{ width: 150, textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {deliveries.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 800 }}>{d.code || "-"}</td>
                        <td>{d.order?.code || "-"}</td>
                        <td>
                          {d.rider?.code ? `${d.rider.code} - ` : ""}
                          {d.rider?.fullName || d.riderId}
                        </td>
                        <td>
                          <span style={badgeStyle(d.status)}>{d.status}</span>
                        </td>
                        <td>{d.destinationAddress || "-"}</td>
                        <td>
                          {d.locations && d.locations.length > 0
                            ? `${d.locations[0].latitude}, ${d.locations[0].longitude}`
                            : "-"}
                        </td>
                        <td className="text-center">{renderStatusButtons(d)}</td>
                      </tr>
                    ))}

                    {deliveries.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No deliveries found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              {isBranchManager
                ? "Branch Manager can assign riders to deliveries for accessible orders."
                : isRider
                ? "Delivery Rider can update assigned delivery progress."
                : "Admin Staff can create and manage delivery workflow."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}