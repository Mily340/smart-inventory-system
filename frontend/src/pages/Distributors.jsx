// frontend/src/pages/Distributors.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const smallActionBtnStyle = {
  borderRadius: 8,
  fontWeight: 700,
  padding: "4px 8px",
  fontSize: 12,
  lineHeight: 1.2,
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
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("fullName");
      sessionStorage.removeItem("branchId");
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
    marginTop: 10,
    paddingBottom: 18,
  };

  const panelStyle = {
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,.32)",
    boxShadow: "0 6px 16px rgba(15,23,42,.04)",
    overflow: "hidden",
  };

  const headerCardStyle = {
    background: "linear-gradient(180deg, rgba(219,234,254,.45), rgba(255,255,255,1))",
    borderBottom: "1px solid rgba(148,163,184,.22)",
  };

  const inputStyle = {
    borderRadius: 10,
  };

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h3 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Distributors
            </h3>
            <div className="text-muted" style={{ marginTop: 2, fontSize: 14 }}>
              Manage distributor profiles for customer orders and deliveries.
            </div>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            style={{
              borderRadius: 10,
              fontWeight: 700,
              padding: "6px 12px",
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
          <div className="alert alert-danger py-2 mb-2" style={{ borderRadius: 12 }}>
            {error}
          </div>
        ) : null}

        <div className="row g-2 mb-3">
          <SummaryCard
            title="Total Distributors"
            value={summary.total}
            icon="bi-people"
            hint="Registered records"
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

        <div className="card mb-3" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                  Create Distributor
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Add contact details for order processing.
                </div>
              </div>

              <span
                className="text-muted"
                style={{
                  fontSize: 11.5,
                  padding: "4px 9px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,.35)",
                  background: "rgba(255,255,255,.85)",
                }}
              >
                Auto code generated
              </span>
            </div>
          </div>

          <div className="card-body py-2 px-3">
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
                    borderRadius: 10,
                    fontWeight: 800,
                    minHeight: 31,
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
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Distributor List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${items.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            {loading ? (
              <div className="text-muted">Loading distributors...</div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-sm table-bordered table-hover align-middle mb-0"
                  style={{ fontSize: 13 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 95 }}>Code</th>
                      <th style={{ minWidth: 170 }}>Name</th>
                      <th style={{ minWidth: 210 }}>Email</th>
                      <th style={{ width: 145 }}>Phone</th>
                      <th style={{ minWidth: 170 }}>Address</th>
                      <th style={{ width: 160, textAlign: "center" }}>Actions</th>
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
                          <div className="d-inline-flex gap-1 justify-content-center align-items-center">
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
                        <td colSpan="6" className="text-center text-muted py-3">
                          No distributors found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
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
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,.35)",
                  boxShadow: "0 18px 45px rgba(15,23,42,.16)",
                  overflow: "hidden",
                }}
              >
                <form onSubmit={updateDistributor}>
                  <div
                    className="modal-header py-2 px-3"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(219,234,254,.6), rgba(255,255,255,1))",
                    }}
                  >
                    <div>
                      <h5 className="modal-title" style={{ fontWeight: 900, fontSize: 17 }}>
                        Edit Distributor
                      </h5>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Update distributor contact information.
                      </div>
                    </div>

                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body py-3 px-3">
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="form-label small text-muted mb-1">Name</label>
                        <input
                          className="form-control form-control-sm"
                          style={inputStyle}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small text-muted mb-1">Email</label>
                        <input
                          className="form-control form-control-sm"
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
                          className="form-control form-control-sm"
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
                          className="form-control form-control-sm"
                          style={inputStyle}
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer py-2 px-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      style={{ borderRadius: 9, fontWeight: 700 }}
                      onClick={closeEdit}
                      disabled={!!busyId}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn btn-primary btn-sm"
                      style={{ borderRadius: 9, fontWeight: 800 }}
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
        className="h-100"
        style={{
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,.28)",
          boxShadow: "0 5px 13px rgba(15,23,42,.04)",
          background: "rgba(255,255,255,.88)",
          padding: "10px 14px",
          minHeight: 82,
        }}
      >
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div style={{ minWidth: 0 }}>
            <div className="text-muted" style={{ fontSize: 12, fontWeight: 800 }}>
              {title}
            </div>

            <div style={{ fontSize: 23, lineHeight: 1.05, fontWeight: 900, color: "#0F172A" }}>
              {value}
            </div>

            <div className="text-muted" style={{ fontSize: 11.5 }}>
              {hint}
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: "rgba(219,234,254,.55)",
              border: "1px solid rgba(147,197,253,.55)",
              color: "#1D4ED8",
              fontSize: 15,
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