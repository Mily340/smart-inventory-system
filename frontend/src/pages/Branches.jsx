// frontend/src/pages/Branches.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const statusBadgeStyle = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  border: active ? "1px solid #A7F3D0" : "1px solid #E5E7EB",
  background: active ? "#ECFDF5" : "#F3F4F6",
  color: active ? "#047857" : "#4B5563",
  whiteSpace: "nowrap",
});

const smallActionBtnStyle = {
  borderRadius: 9,
  fontWeight: 700,
  padding: "5px 10px",
  fontSize: 13,
  lineHeight: 1.25,
  whiteSpace: "nowrap",
};

const toggleBtnStyle = {
  ...smallActionBtnStyle,
  minWidth: 112,
};

export default function Branches() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [eName, setEName] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eLat, setELat] = useState("");
  const [eLng, setELng] = useState("");
  const [eActive, setEActive] = useState(true);

  const summary = useMemo(() => {
    const active = branches.filter((b) => b.isActive !== false).length;
    const inactive = branches.length - active;

    return {
      total: branches.length,
      active,
      inactive,
    };
  }, [branches]);

  const clearAuthAndRedirect = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("branchId");
    sessionStorage.removeItem("branchName");
    sessionStorage.removeItem("branchIsActive");

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    localStorage.removeItem("branchId");
    localStorage.removeItem("branchName");
    localStorage.removeItem("branchIsActive");

    navigate("/login", { replace: true });
  };

  const handleUnauthorized = (msg) => {
    const text = String(msg || "").toLowerCase();

    if (text.includes("unauthorized") || text.includes("invalid or expired token")) {
      clearAuthAndRedirect();
      return true;
    }

    return false;
  };

  const fetchBranches = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await client.get("/branches");
      const data = res.data?.data || [];
      setBranches(data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branches";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createBranch = async (e) => {
    e.preventDefault();
    setError("");

    const lat = latitude === "" ? null : Number(latitude);
    const lng = longitude === "" ? null : Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Valid latitude and longitude are required.");
      return;
    }

    try {
      await client.post("/branches", {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || null,
        latitude: lat,
        longitude: lng,
      });

      setName("");
      setAddress("");
      setPhone("");
      setLatitude("");
      setLongitude("");
      await fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create branch");
    }
  };

  const openEdit = (b) => {
    setError("");
    setEditId(b.id);
    setEName(b.name || "");
    setEAddress(b.address || "");
    setEPhone(b.phone || "");
    setELat(b.latitude ?? "");
    setELng(b.longitude ?? "");
    setEActive(b.isActive !== false);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (busyId) return;
    setEditOpen(false);
    setEditId("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");
    setBusyId(editId);

    const lat = eLat === "" ? null : Number(eLat);
    const lng = eLng === "" ? null : Number(eLng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Valid latitude and longitude are required.");
      setBusyId("");
      return;
    }

    try {
      await client.put(`/branches/${editId}`, {
        name: eName.trim(),
        address: eAddress.trim(),
        phone: ePhone.trim() || null,
        latitude: lat,
        longitude: lng,
        isActive: !!eActive,
      });

      setEditOpen(false);
      setEditId("");
      await fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update branch");
    } finally {
      setBusyId("");
    }
  };

  const toggleActive = async (b) => {
    setError("");
    setBusyId(b.id);

    const nextStatus = !(b.isActive !== false);

    try {
      await client.put(`/branches/${b.id}`, {
        isActive: nextStatus,
      });

      await fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update branch status");
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
              Branches
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              Manage branch locations, contact numbers, operational status, and geographic
              details.
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
            onClick={fetchBranches}
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
            title="Total Branches"
            value={summary.total}
            icon="bi-building"
            hint="All registered locations"
          />

          <SummaryCard
            title="Active"
            value={summary.active}
            icon="bi-check-circle"
            hint="Available for operations"
          />

          <SummaryCard
            title="Inactive"
            value={summary.inactive}
            icon="bi-pause-circle"
            hint="Temporarily disabled"
          />
        </div>

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Create Branch
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Add a new branch with address, phone number, and map coordinates.
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
            <form onSubmit={createBranch} className="row g-2 align-items-end">
              <div className="col-12 col-xl-2">
                <label className="form-label small text-muted mb-1" htmlFor="branchName">
                  Name
                </label>

                <input
                  id="branchName"
                  name="branchName"
                  className="form-control"
                  style={inputStyle}
                  placeholder="Head Office"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-xl-3">
                <label className="form-label small text-muted mb-1" htmlFor="branchAddress">
                  Address
                </label>

                <input
                  id="branchAddress"
                  name="branchAddress"
                  className="form-control"
                  style={inputStyle}
                  placeholder="Uttara, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-xl-2">
                <label className="form-label small text-muted mb-1" htmlFor="branchPhone">
                  Phone
                </label>

                <input
                  id="branchPhone"
                  name="branchPhone"
                  className="form-control"
                  style={inputStyle}
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="col-6 col-xl-2">
                <label className="form-label small text-muted mb-1" htmlFor="branchLatitude">
                  Latitude
                </label>

                <input
                  id="branchLatitude"
                  name="branchLatitude"
                  className="form-control"
                  style={inputStyle}
                  placeholder="23.8103"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>

              <div className="col-6 col-xl-2">
                <label className="form-label small text-muted mb-1" htmlFor="branchLongitude">
                  Longitude
                </label>

                <input
                  id="branchLongitude"
                  name="branchLongitude"
                  className="form-control"
                  style={inputStyle}
                  placeholder="90.4125"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-xl-1 d-grid">
                <button
                  className="btn btn-primary"
                  style={{
                    borderRadius: 12,
                    fontWeight: 800,
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <i className="bi bi-plus-circle"></i>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Branch List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${branches.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading branches...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 95 }}>Code</th>
                      <th style={{ minWidth: 150 }}>Name</th>
                      <th style={{ minWidth: 210 }}>Address</th>
                      <th style={{ minWidth: 140 }}>Phone</th>
                      <th style={{ width: 115 }}>Latitude</th>
                      <th style={{ width: 115 }}>Longitude</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ width: 235, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {branches.map((b) => {
                      const active = b.isActive !== false;

                      return (
                        <tr
                          key={b.id}
                          style={
                            !active
                              ? {
                                  background: "rgba(248,250,252,.75)",
                                  color: "#64748B",
                                }
                              : undefined
                          }
                        >
                          <td style={{ fontWeight: 800 }}>{b.code || "-"}</td>
                          <td style={{ fontWeight: 800 }}>{b.name || "-"}</td>
                          <td>{b.address || "-"}</td>
                          <td>{b.phone || "-"}</td>
                          <td>{b.latitude ?? "-"}</td>
                          <td>{b.longitude ?? "-"}</td>

                          <td>
                            <span style={statusBadgeStyle(active)}>
                              <i
                                className={`bi ${
                                  active ? "bi-check-circle" : "bi-pause-circle"
                                }`}
                              ></i>
                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="text-center">
                            <div className="d-inline-flex gap-2 justify-content-center align-items-center">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                style={smallActionBtnStyle}
                                onClick={() => openEdit(b)}
                                disabled={busyId === b.id}
                              >
                                <i className="bi bi-pencil-square me-1"></i>
                                Edit
                              </button>

                              <button
                                className={`btn btn-sm ${
                                  active ? "btn-outline-danger" : "btn-outline-success"
                                }`}
                                style={toggleBtnStyle}
                                onClick={() => toggleActive(b)}
                                disabled={busyId === b.id}
                                title={
                                  active ? "Deactivate this branch" : "Activate this branch"
                                }
                              >
                                {busyId === b.id ? (
                                  "Working..."
                                ) : active ? (
                                  <>
                                    <i className="bi bi-slash-circle me-1"></i>
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-circle me-1"></i>
                                    Activate
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {branches.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          No branches found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              Inactive branches remain stored in the system. Assigned Branch Managers
              and Branch Staff cannot access operational pages while their branch is inactive.
            </div>
          </div>
        </div>
      </div>

      {editOpen ? (
        <>
          <div className="modal show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div
                className="modal-content"
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(148,163,184,.35)",
                  boxShadow: "0 18px 45px rgba(15,23,42,.16)",
                  overflow: "hidden",
                }}
              >
                <form onSubmit={saveEdit}>
                  <div
                    className="modal-header"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(219,234,254,.65), rgba(255,255,255,1))",
                    }}
                  >
                    <div>
                      <h5 className="modal-title" style={{ fontWeight: 900 }}>
                        Edit Branch
                      </h5>

                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Update branch details, contact number, and operational status.
                      </div>
                    </div>

                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label
                          className="form-label small text-muted mb-1"
                          htmlFor="editBranchName"
                        >
                          Name
                        </label>

                        <input
                          id="editBranchName"
                          name="editBranchName"
                          className="form-control"
                          style={inputStyle}
                          value={eName}
                          onChange={(e) => setEName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label
                          className="form-label small text-muted mb-1"
                          htmlFor="editBranchAddress"
                        >
                          Address
                        </label>

                        <input
                          id="editBranchAddress"
                          name="editBranchAddress"
                          className="form-control"
                          style={inputStyle}
                          value={eAddress}
                          onChange={(e) => setEAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label
                          className="form-label small text-muted mb-1"
                          htmlFor="editBranchPhone"
                        >
                          Phone
                        </label>

                        <input
                          id="editBranchPhone"
                          name="editBranchPhone"
                          className="form-control"
                          style={inputStyle}
                          value={ePhone}
                          placeholder="017XXXXXXXX"
                          onChange={(e) => setEPhone(e.target.value)}
                        />
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label small text-muted mb-1"
                          htmlFor="editBranchLatitude"
                        >
                          Latitude
                        </label>

                        <input
                          id="editBranchLatitude"
                          name="editBranchLatitude"
                          className="form-control"
                          style={inputStyle}
                          value={eLat}
                          onChange={(e) => setELat(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-6">
                        <label
                          className="form-label small text-muted mb-1"
                          htmlFor="editBranchLongitude"
                        >
                          Longitude
                        </label>

                        <input
                          id="editBranchLongitude"
                          name="editBranchLongitude"
                          className="form-control"
                          style={inputStyle}
                          value={eLng}
                          onChange={(e) => setELng(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <div
                          className="p-3"
                          style={{
                            borderRadius: 14,
                            background: "rgba(248,250,252,.9)",
                            border: "1px solid rgba(148,163,184,.25)",
                          }}
                        >
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="branchActive"
                              checked={eActive}
                              onChange={(e) => setEActive(e.target.checked)}
                            />

                            <label className="form-check-label fw-semibold" htmlFor="branchActive">
                              Active branch
                            </label>
                          </div>

                          <div className="text-muted small mt-1">
                            If inactive, assigned Branch Managers and Branch Staff will see
                            only the inactive branch notice after login.
                          </div>
                        </div>
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
        <div className="d-flex justify-content-between align-items-start">
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
            }}
          >
            <i className={`bi ${icon}`}></i>
          </div>
        </div>
      </div>
    </div>
  );
}