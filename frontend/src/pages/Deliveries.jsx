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

  const role = sessionStorage.getItem("role") || "";

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInventoryOfficer = role === "INVENTORY_OFFICER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const isRider = role === "DELIVERY_RIDER";

  const canCreateDelivery = isSuperAdmin || isInventoryOfficer || isBranchManager;
  const canManageStatus = isSuperAdmin || isInventoryOfficer || isBranchManager || isRider;

  const deliverableOrders = useMemo(() => {
    const existingDeliveryOrderIds = new Set(
      deliveries
        .map((delivery) => delivery.orderId || delivery.order?.id)
        .filter(Boolean)
    );

    return orders.filter((order) => {
      const status = String(order.status || "").toUpperCase();
      const isEligibleStatus = ["APPROVED", "PACKED", "DISPATCHED"].includes(status);
      const alreadyHasDelivery = existingDeliveryOrderIds.has(order.id);

      return isEligibleStatus && !alreadyHasDelivery;
    });
  }, [orders, deliveries]);

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

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      const requests = [client.get("/orders"), client.get("/deliveries")];

      if (canCreateDelivery) {
        requests.push(client.get("/users/riders"));
      }

      const responses = await Promise.all(requests);

      const fetchedOrders = responses[0].data?.data || [];
      const fetchedDeliveries = responses[1].data?.data || [];
      const fetchedRiders = canCreateDelivery ? responses[2].data?.data || [] : [];

      setOrders(fetchedOrders);
      setDeliveries(fetchedDeliveries);
      setRiders(fetchedRiders);

      const existingDeliveryOrderIds = new Set(
        fetchedDeliveries
          .map((delivery) => delivery.orderId || delivery.order?.id)
          .filter(Boolean)
      );

      const filteredOrders = fetchedOrders.filter((order) => {
        const status = String(order.status || "").toUpperCase();
        const isEligibleStatus = ["APPROVED", "PACKED", "DISPATCHED"].includes(status);
        const alreadyHasDelivery = existingDeliveryOrderIds.has(order.id);

        return isEligibleStatus && !alreadyHasDelivery;
      });

      if (filteredOrders.length > 0) {
        const selectedOrderStillAvailable = filteredOrders.some((order) => order.id === orderId);
        setOrderId(selectedOrderStillAvailable ? orderId : filteredOrders[0].id);
      } else {
        setOrderId("");
      }

      if (fetchedRiders.length > 0) {
        const selectedRiderStillAvailable = fetchedRiders.some((rider) => rider.id === riderId);
        setRiderId(selectedRiderStillAvailable ? riderId : fetchedRiders[0].id);
      } else {
        setRiderId("");
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

    const cleanDestinationAddress = destinationAddress.trim();

    if (!orderId) {
      setError("Please select an eligible order.");
      return;
    }

    if (!riderId) {
      setError("Please select a rider.");
      return;
    }

    if (!cleanDestinationAddress) {
      setError("Please enter a destination address.");
      return;
    }

    const selectedOrder = deliverableOrders.find((order) => order.id === orderId);

    if (!selectedOrder) {
      setError("This order is not eligible for delivery or already has a delivery.");
      return;
    }

    try {
      await client.post("/deliveries", {
        orderId,
        riderId,
        destinationAddress: cleanDestinationAddress,
      });

      setOrderId("");
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
                    Select an eligible order, assign a rider, and enter the destination address.
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
                  Approved/Packed/Dispatched orders only
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
                    disabled={deliverableOrders.length === 0}
                  >
                    {deliverableOrders.length === 0 ? (
                      <option value="">No eligible orders available</option>
                    ) : (
                      deliverableOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code ? `${o.code} - ` : ""}
                          {o.distributor?.name || "Distributor"} ({o.status})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted mb-1">Rider</label>

                  <select
                    className="form-select"
                    style={{ borderRadius: 12 }}
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    required
                    disabled={riders.length === 0}
                  >
                    {riders.length === 0 ? (
                      <option value="">No riders available</option>
                    ) : (
                      riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.code ? `${r.code} - ` : ""}
                          {r.fullName}
                          {r.branch?.name ? ` (${r.branch.name})` : ""}
                        </option>
                      ))
                    )}
                  </select>

                  {riders.length === 0 ? (
                    <div className="form-text">No delivery riders found.</div>
                  ) : null}
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small text-muted mb-1">
                    Destination <span className="text-danger">*</span>
                  </label>

                  <input
                    className="form-control"
                    style={{ borderRadius: 12 }}
                    placeholder="Enter full destination address"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    required
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
                    disabled={
                      !orderId ||
                      !riderId ||
                      !destinationAddress.trim() ||
                      deliverableOrders.length === 0
                    }
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
                      <th style={{ minWidth: 260 }}>Destination</th>
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
                        <td className="text-center">{renderStatusButtons(d)}</td>
                      </tr>
                    ))}

                    {deliveries.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
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
                : "Admin Staff can create and manage delivery workflow. Orders already assigned to delivery are hidden from the create delivery dropdown."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}