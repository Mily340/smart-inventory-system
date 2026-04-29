// frontend/src/pages/Branches.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

export default function Branches() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  // Create form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [eName, setEName] = useState("");
  const [eAddress, setEAddress] = useState("");
  const [eLat, setELat] = useState("");
  const [eLng, setELng] = useState("");
  const [eActive, setEActive] = useState(true);

  useMemo(() => {
    const m = new Map();
    branches.forEach((b) => m.set(b.id, b));
    return m;
  }, [branches]);

  const fetchBranches = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await client.get("/branches");
      setBranches(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branches";
      setError(msg);
      if (msg.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("fullName");
        navigate("/login");
      }
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

    try {
      await client.post("/branches", {
        name: name.trim(),
        address: address.trim(),
        latitude: latitude === "" ? null : Number(latitude),
        longitude: longitude === "" ? null : Number(longitude),
      });

      setName("");
      setAddress("");
      setLatitude("");
      setLongitude("");
      fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create branch");
    }
  };

  const openEdit = (b) => {
    setError("");
    setEditId(b.id);
    setEName(b.name || "");
    setEAddress(b.address || "");
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

    try {
      await client.put(`/branches/${editId}`, {
        name: eName.trim(),
        address: eAddress.trim(),
        latitude: eLat === "" ? null : Number(eLat),
        longitude: eLng === "" ? null : Number(eLng),
        isActive: !!eActive,
      });

      setEditOpen(false);
      setEditId("");
      fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update branch");
    } finally {
      setBusyId("");
    }
  };

  const toggleActive = async (b) => {
    setError("");
    setBusyId(b.id);
    const next = !(b.isActive !== false);

    try {
      await client.put(`/branches/${b.id}`, { isActive: next });
      fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 28, marginBottom: 40 }}>
        <div className="mb-3">
          <h2 className="m-0 text-center" style={{ fontWeight: 800 }}>
            Branches
          </h2>
          <div
            className="text-center text-muted"
            style={{ fontSize: 13, marginTop: 6 }}
          >
            Create, edit, activate/deactivate branches
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {/* Create */}
        <div className="card mb-4" style={{ borderRadius: 14 }}>
          <div className="card-body">
            <h6 className="card-title" style={{ fontWeight: 800 }}>
              Create Branch
            </h6>

            {/* key changes:
                - use col-lg for better fit (button stays on same row)
                - give button column enough width (col-lg-2) */}
            <form onSubmit={createBranch} className="row g-2 align-items-end">
              <div className="col-12 col-lg-3">
                <label className="form-label mb-1">Name</label>
                <input
                  className="form-control"
                  placeholder="Head Office"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-lg-3">
                <label className="form-label mb-1">Address</label>
                <input
                  className="form-control"
                  placeholder="Uttara, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="col-6 col-lg-2">
                <label className="form-label mb-1">Latitude</label>
                <input
                  className="form-control"
                  placeholder="23.8103"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>

              <div className="col-6 col-lg-2">
                <label className="form-label mb-1">Longitude</label>
                <input
                  className="form-control"
                  placeholder="90.4125"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>

              <div className="col-12 col-lg-2 d-grid">
                <button
                  className="btn btn-primary"
                  style={{
                    borderRadius: 12,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    paddingInline: 18,
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead style={{ background: "#F3F6FF" }}>
                <tr>
                  <th style={{ width: 90 }}>Code</th>
                  <th>Name</th>
                  <th>Address</th>
                  <th style={{ width: 120 }}>Latitude</th>
                  <th style={{ width: 120 }}>Longitude</th>
                  <th style={{ width: 120 }}>Status</th>

                  {/* Action header centered */}
                  <th style={{ width: 240 }} className="text-center">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {branches.map((b) => {
                  const active = b.isActive !== false;
                  return (
                    <tr
                      key={b.id}
                      style={!active ? { background: "#fafafa" } : undefined}
                    >
                      <td>{b.code || "-"}</td>
                      <td style={{ fontWeight: 700 }}>{b.name}</td>
                      <td>{b.address}</td>
                      <td>{b.latitude ?? "-"}</td>
                      <td>{b.longitude ?? "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            active ? "text-bg-success" : "text-bg-secondary"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Action cell centered */}
                      <td className="text-center">
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ borderRadius: 10 }}
                            onClick={() => openEdit(b)}
                            disabled={busyId === b.id}
                          >
                            Edit
                          </button>

                          <button
                            className={`btn btn-sm ${
                              active
                                ? "btn-outline-danger"
                                : "btn-outline-success"
                            }`}
                            style={{ borderRadius: 10, minWidth: 98 }}
                            onClick={() => toggleActive(b)}
                            disabled={busyId === b.id}
                          >
                            {busyId === b.id
                              ? "Working..."
                              : active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {branches.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No branches found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editOpen ? (
        <>
          <div
            className="modal show"
            style={{ display: "block" }}
            tabIndex="-1"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content" style={{ borderRadius: 14 }}>
                <form onSubmit={saveEdit}>
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Branch</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeEdit}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          value={eName}
                          onChange={(e) => setEName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label">Address</label>
                        <input
                          className="form-control"
                          value={eAddress}
                          onChange={(e) => setEAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-6">
                        <label className="form-label">Latitude</label>
                        <input
                          className="form-control"
                          value={eLat}
                          onChange={(e) => setELat(e.target.value)}
                        />
                      </div>

                      <div className="col-6">
                        <label className="form-label">Longitude</label>
                        <input
                          className="form-control"
                          value={eLng}
                          onChange={(e) => setELng(e.target.value)}
                        />
                      </div>

                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="branchActive"
                            checked={eActive}
                            onChange={(e) => setEActive(e.target.checked)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="branchActive"
                          >
                            Active
                          </label>
                        </div>
                        <div className="text-muted small mt-1">
                          If inactive, this branch stays in the system but should
                          not be used for operations.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeEdit}
                      disabled={!!busyId}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" disabled={!!busyId}>
                      {busyId ? "Saving..." : "Save"}
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