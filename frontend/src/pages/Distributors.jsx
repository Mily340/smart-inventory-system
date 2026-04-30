// frontend/src/pages/Distributors.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const smallActionBtnStyle = {
  borderRadius: 9,
  fontWeight: 700,
  padding: "5px 10px",
  fontSize: 13,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
};

export default function Distributors() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const summary = useMemo(() => {
    return {
      total: items.length,
      withEmail: items.filter((d) => d.email).length,
      withPhone: items.filter((d) => d.phone).length,
    };
  }, [items]);

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

  const fetchDistributors = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await client.get("/distributors");
      setItems(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load distributors";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createDistributor = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await client.post("/distributors", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      });

      setName("");
      setEmail("");
      setPhone("");
      setAddress("");

      await fetchDistributors();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create distributor");
    }
  };

  const openEdit = (d) => {
    setError("");
    setEditId(d.id);
    setEditName(d.name || "");
    setEditEmail(d.email || "");
    setEditPhone(d.phone || "");
    setEditAddress(d.address || "");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (busyId) return;
    setEditOpen(false);
    setEditId("");
    setEditName("");
    setEditEmail("");
    setEditPhone("");
    setEditAddress("");
  };

  const updateDistributor = async (e) => {
    e.preventDefault();
    setError("");
    setBusyId(editId);

    try {
      await client.put(`/distributors/${editId}`, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
      });

      closeEdit();
      await fetchDistributors();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update distributor");
    } finally {
      setBusyId("");
    }
  };

  const deleteDistributor = async (d) => {
    const ok = window.confirm(
      `Delete distributor "${d.name}"?\n\nThis action cannot be undone.`
    );

    if (!ok) return;

    setError("");
    setBusyId(d.id);

    try {
      await client.delete(`/distributors/${d.id}`);
      await fetchDistributors();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete distributor");
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

  const inputStyle = {
    borderRadius: 12,
  };

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Distributors
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              Manage distributor profiles used for customer orders and deliveries.
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
            onClick={fetchDistributors}
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

        <div className="row g-3 mb-4">
          <SummaryCard
            title="Total Distributors"
            value={summary.total}
            icon="bi-people"
            hint="Registered distributor records"
          />

          <SummaryCard
            title="With Email"
            value={summary.withEmail}
            icon="bi-envelope"
            hint="Contactable by email"
          />

          <SummaryCard
            title="With Phone"
            value={summary.withPhone}
            icon="bi-telephone"
            hint="Contactable by phone"
          />
        </div>

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Create Distributor
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Add distributor contact details for order processing.
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
                Auto code generated
              </span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={createDistributor} className="row g-2 align-items-end">
              <div className="col-12 col-xl-3">
                <label className="form-label small text-muted mb-1">Name</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="ABC Distributor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-xl-3">
                <label className="form-label small text-muted mb-1">Email</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  type="email"
                  placeholder="abc@distributor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-xl-2">
                <label className="form-label small text-muted mb-1">Phone optional</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="01700000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="col-12 col-xl-2">
                <label className="form-label small text-muted mb-1">Address optional</label>
                <input
                  className="form-control form-control-sm"
                  style={inputStyle}
                  placeholder="Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="col-12 col-xl-2 d-grid">
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    borderRadius: 12,
                    fontWeight: 800,
                    minHeight: 34,
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Distributor List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${items.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading distributors...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 110 }}>Code</th>
                      <th style={{ minWidth: 190 }}>Name</th>
                      <th style={{ minWidth: 230 }}>Email</th>
                      <th style={{ width: 160 }}>Phone</th>
                      <th style={{ minWidth: 190 }}>Address</th>
                      <th style={{ width: 190, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 800 }}>{d.code || "-"}</td>
                        <td style={{ fontWeight: 800 }}>{d.name || "-"}</td>
                        <td>
                          {d.email ? (
                            <span>
                              <i className="bi bi-envelope me-1 text-muted"></i>
                              {d.email}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          {d.phone ? (
                            <span>
                              <i className="bi bi-telephone me-1 text-muted"></i>
                              {d.phone}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{d.address || "-"}</td>
                        <td className="text-center">
                          <div className="d-inline-flex gap-2 justify-content-center align-items-center">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              style={smallActionBtnStyle}
                              onClick={() => openEdit(d)}
                              disabled={busyId === d.id}
                            >
                              <i className="bi bi-pencil-square me-1"></i>
                              Edit
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={smallActionBtnStyle}
                              onClick={() => deleteDistributor(d)}
                              disabled={busyId === d.id}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted py-4">
                          No distributors found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              Distributor records are used when creating customer orders. Distributors already used
              in orders cannot be deleted.
            </div>
          </div>
        </div>
      </div>

      {editOpen ? (
        <>
          <div className="modal show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content"
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,.35)",
                  boxShadow: "0 18px 45px rgba(15,23,42,.16)",
                  overflow: "hidden",
                }}
              >
                <form onSubmit={updateDistributor}>
                  <div
                    className="modal-header"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(219,234,254,.65), rgba(255,255,255,1))",
                    }}
                  >
                    <div>
                      <h5 className="modal-title" style={{ fontWeight: 900 }}>
                        Edit Distributor
                      </h5>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Update distributor contact information.
                      </div>
                    </div>

                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small text-muted mb-1">Name</label>
                        <input
                          className="form-control"
                          style={inputStyle}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small text-muted mb-1">Email</label>
                        <input
                          className="form-control"
                          style={inputStyle}
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small text-muted mb-1">Phone optional</label>
                        <input
                          className="form-control"
                          style={inputStyle}
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small text-muted mb-1">
                          Address optional
                        </label>
                        <input
                          className="form-control"
                          style={inputStyle}
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ borderRadius: 10, fontWeight: 700 }}
                      onClick={closeEdit}
                      disabled={!!busyId}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn btn-primary"
                      style={{ borderRadius: 10, fontWeight: 800 }}
                      disabled={!!busyId}
                    >
                      {busyId ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" onClick={closeEdit} />
        </>
      ) : null}
    </>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
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