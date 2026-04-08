import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await client.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark as read");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <h4 className="mb-3">Notifications</h4>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="list-group">
            {items.map((n) => (
              <div
                key={n.id}
                className={`list-group-item d-flex justify-content-between align-items-start ${
                  n.isRead ? "opacity-75" : ""
                }`}
              >
                <div className="me-3">
                  <div className="d-flex gap-2 align-items-center">
                    <span className="badge bg-primary">{n.type}</span>
                    <strong>{n.title}</strong>
                    {!n.isRead ? <span className="badge bg-warning text-dark">NEW</span> : null}
                  </div>
                  <div className="mt-1">{n.message}</div>
                  <div className="text-muted small mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                {!n.isRead ? (
                  <button className="btn btn-sm btn-outline-success" onClick={() => markRead(n.id)}>
                    Mark read
                  </button>
                ) : null}
              </div>
            ))}

            {items.length === 0 ? (
              <div className="text-center text-muted mt-3">No notifications</div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}