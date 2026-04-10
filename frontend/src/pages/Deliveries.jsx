import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

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

  const fetchAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [oRes, dRes] = await Promise.all([
        client.get("/orders"),
        client.get("/deliveries"),
      ]);

      const o = oRes.data?.data || [];
      const d = dRes.data?.data || [];

      // riders list from orders response is not available, so fetch users by role isn't implemented
      // workaround: use /auth/users endpoint if you have it; otherwise keep manual riderId
      // For now, we will fetch riders from deliveries list + keep create field as manual
      const riderMap = new Map();
      d.forEach((x) => {
        if (x.rider) riderMap.set(x.rider.id, x.rider);
      });

      setOrders(o);
      setDeliveries(d);
      setRiders(Array.from(riderMap.values()));

      if (!orderId && o.length > 0) setOrderId(o[0].id);
      if (!riderId && riders.length > 0) setRiderId(riders[0].id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load deliveries";
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

  const createDelivery = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/deliveries", { orderId, riderId, destinationAddress });
      setDestinationAddress("");
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create delivery");
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    try {
      await client.patch(`/deliveries/${id}/status`, { status });
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    }
  };

  const renderStatusButtons = (d) => {
    if (d.status === "ASSIGNED") {
      return (
        <button className="btn btn-sm btn-outline-primary" onClick={() => updateStatus(d.id, "PICKED_UP")}>
          Picked Up
        </button>
      );
    }
    if (d.status === "PICKED_UP") {
      return (
        <button className="btn btn-sm btn-outline-primary" onClick={() => updateStatus(d.id, "IN_TRANSIT")}>
          In Transit
        </button>
      );
    }
    if (d.status === "IN_TRANSIT") {
      return (
        <button className="btn btn-sm btn-outline-success" onClick={() => updateStatus(d.id, "DELIVERED")}>
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
        <h4 className="mb-3">Deliveries</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">Create Delivery</h6>

            <form onSubmit={createDelivery} className="row g-2">
              <div className="col-md-5">
                <select className="form-select" value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code ? `${o.code} - ` : ""}{o.distributor?.name || "Distributor"} ({o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Rider ID (e.g., U002 id)"
                  value={riderId}
                  onChange={(e) => setRiderId(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Destination Address"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                />
              </div>

              <div className="col-md-1">
                <button className="btn btn-primary w-100">Create</button>
              </div>
            </form>

            <div className="small text-muted mt-2">
              Note: Rider dropdown can be added after we implement a Users list API (filter DELIVERY_RIDER).
            </div>
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
                  <th>Order</th>
                  <th>Rider</th>
                  <th>Status</th>
                  <th>Destination</th>
                  <th>Latest Location</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id}>
                    <td>{d.code || "-"}</td>
                    <td>{d.order?.code || "-"}</td>
                    <td>{d.rider?.fullName || d.riderId}</td>
                    <td>{d.status}</td>
                    <td>{d.destinationAddress || "-"}</td>
                    <td>
                      {d.locations && d.locations.length > 0
                        ? `${d.locations[0].latitude}, ${d.locations[0].longitude}`
                        : "-"}
                    </td>
                    <td>{renderStatusButtons(d)}</td>
                  </tr>
                ))}

                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No deliveries found
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