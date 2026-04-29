import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import NavBar from "../components/NavBar";

const CREATE_ROLES = ["BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF", "DELIVERY_RIDER"]; // NO SUPER_ADMIN

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);

  const [cFullName, setCFullName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cRole, setCRole] = useState("BRANCH_STAFF");
  const [cBranchId, setCBranchId] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cPassword2, setCPassword2] = useState("");

  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [eFullName, setEFullName] = useState("");
  const [eRole, setERole] = useState("BRANCH_STAFF");
  const [eBranchId, setEBranchId] = useState("");

  // reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [rp1, setRp1] = useState("");
  const [rp2, setRp2] = useState("");
  const [showRp1, setShowRp1] = useState(false);
  const [showRp2, setShowRp2] = useState(false);

  const branchById = useMemo(() => {
    const m = new Map();
    branches.forEach((b) => m.set(b.id, b));
    return m;
  }, [branches]);

  const fetchAll = async () => {
    setError("");
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([client.get("/users"), client.get("/branches")]);
      const u = uRes.data?.data || [];
      const br = bRes.data?.data || [];
      setUsers(u);
      setBranches(br);

      // default branch for create
      if (!cBranchId && br.length > 0) setCBranchId(br[0].id);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users/branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const okRole = roleFilter ? u.role === roleFilter : true;
      const okBranch = branchFilter ? (u.branchId || "") === branchFilter : true;
      return okRole && okBranch;
    });
  }, [users, roleFilter, branchFilter]);

  const openCreate = () => {
    setError("");
    setCreateOpen(true);
    setSavingCreate(false);

    setCFullName("");
    setCEmail("");
    setCRole("BRANCH_STAFF");
    setCPassword("");
    setCPassword2("");

    if (branches.length > 0) setCBranchId(branches[0].id);
    else setCBranchId("");
  };

  const closeCreate = () => {
    if (savingCreate) return;
    setCreateOpen(false);
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!cFullName.trim()) return setError("Full name is required");
    if (!cEmail.trim()) return setError("Email is required");
    if (!cPassword) return setError("Password is required");
    if (cPassword !== cPassword2) return setError("Passwords do not match");

    // enforce: cannot create SUPER_ADMIN from UI
    if (cRole === "SUPER_ADMIN") return setError("SUPER_ADMIN cannot be created from UI");

    // all roles here require branch
    if (!cBranchId) return setError("Branch is required for this role");

    setSavingCreate(true);
    try {
      await client.post("/users", {
        fullName: cFullName.trim(),
        email: cEmail.trim(),
        password: cPassword,
        role: cRole,
        branchId: cBranchId,
      });

      setCreateOpen(false);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSavingCreate(false);
    }
  };

  const openEdit = (u) => {
    setError("");
    setEditOpen(true);
    setEditId(u.id);
    setEFullName(u.fullName || "");
    setERole(CREATE_ROLES.includes(u.role) ? u.role : "BRANCH_STAFF");
    setEBranchId(u.branchId || (branches[0]?.id || ""));
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditId("");
    setEFullName("");
    setERole("BRANCH_STAFF");
    setEBranchId("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");

    if (!eFullName.trim()) return setError("Full name is required");
    if (eRole === "SUPER_ADMIN") return setError("SUPER_ADMIN cannot be assigned here");
    if (!eBranchId) return setError("Branch is required for this role");

    setSavingEdit(true);
    try {
      await client.patch(`/users/${editId}`, {
        fullName: eFullName.trim(),
        role: eRole,
        branchId: eBranchId,
      });

      setEditOpen(false);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteUser = async (u) => {
    setError("");
    const ok = window.confirm(`Delete user: ${u.fullName} (${u.email})?`);
    if (!ok) return;

    try {
      await client.delete(`/users/${u.id}`);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const openReset = (u) => {
    setError("");
    setResetUser(u);
    setRp1("");
    setRp2("");
    setShowRp1(false);
    setShowRp2(false);
    setResetting(false);
    setResetOpen(true);
  };

  const closeReset = () => {
    if (resetting) return;
    setResetOpen(false);
    setResetUser(null);
    setRp1("");
    setRp2("");
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!resetUser) return;
    if (!rp1) return setError("New password is required");
    if (rp1 !== rp2) return setError("Passwords do not match");

    setResetting(true);
    try {
      await client.patch(`/users/${resetUser.id}/reset-password`, { newPassword: rp1 });
      setResetOpen(false);
      setResetUser(null);
      setRp1("");
      setRp2("");
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const holdShowHandlers = (setFn) => ({
    onMouseEnter: () => setFn(true),
    onMouseLeave: () => setFn(false),
    onMouseDown: (e) => {
      e.preventDefault();
      setFn(true);
    },
    onMouseUp: () => setFn(false),
    onTouchStart: () => setFn(true),
    onTouchEnd: () => setFn(false),
  });

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 26 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h3 className="m-0">Users</h3>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            <select
              className="form-select"
              style={{ minWidth: 200 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
              <option value="INVENTORY_OFFICER">INVENTORY_OFFICER</option>
              <option value="BRANCH_STAFF">BRANCH_STAFF</option>
              <option value="DELIVERY_RIDER">DELIVERY_RIDER</option>
            </select>

            <select
              className="form-select"
              style={{ minWidth: 220 }}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code ? `${b.code} - ${b.name}` : b.name}
                </option>
              ))}
            </select>

            <button className="btn btn-primary" onClick={openCreate}>
              + Create User
            </button>
          </div>
        </div>

        {error ? <div className="alert alert-danger mt-3">{error}</div> : null}

        {loading ? (
          <div className="mt-3">Loading...</div>
        ) : (
          <div className="table-responsive mt-3">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Code</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th style={{ width: 190 }}>Role</th>
                  <th style={{ width: 220 }}>Branch</th>
                  <th style={{ width: 210 }}>Created</th>
                  <th style={{ width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const b = u.branchId ? branchById.get(u.branchId) : null;
                  const isSuperAdminRow = u.role === "SUPER_ADMIN";

                  return (
                    <tr key={u.id}>
                      <td>{u.code || "-"}</td>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{b ? (b.code ? `${b.code} - ${b.name}` : b.name) : "-"}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>

                      <td>
                        {isSuperAdminRow ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEdit(u)}
                            >
                              Edit
                            </button>

                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => openReset(u)}
                            >
                              Reset Password
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deleteUser(u)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No users found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {createOpen ? (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={createUser}>
                <div className="modal-header">
                  <h5 className="modal-title">Create User</h5>
                  <button type="button" className="btn-close" onClick={closeCreate} />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" value={cFullName} onChange={(e) => setCFullName(e.target.value)} required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
                  </div>

                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={cRole} onChange={(e) => setCRole(e.target.value)}>
                        {CREATE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                        SUPER_ADMIN cannot be created here.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Branch</label>
                      <select
                        className="form-select"
                        value={cBranchId}
                        onChange={(e) => setCBranchId(e.target.value)}
                        disabled={!branches.length}
                        required
                      >
                        {branches.length === 0 ? <option value="">No branches</option> : null}
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code ? `${b.code} - ${b.name}` : b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showPass1 ? "text" : "password"}
                        value={cPassword}
                        onChange={(e) => setCPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        aria-label="Hold to show password"
                        title="Hold to show password"
                        {...holdShowHandlers(setShowPass1)}
                      >
                        <i className={showPass1 ? "bi bi-eye-slash" : "bi bi-eye"} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showPass2 ? "text" : "password"}
                        value={cPassword2}
                        onChange={(e) => setCPassword2(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        aria-label="Hold to show password"
                        title="Hold to show password"
                        {...holdShowHandlers(setShowPass2)}
                      >
                        <i className={showPass2 ? "bi bi-eye-slash" : "bi bi-eye"} />
                      </button>
                    </div>

                    {cPassword2 && cPassword !== cPassword2 ? (
                      <div className="text-danger mt-1" style={{ fontSize: 13 }}>
                        Passwords do not match
                      </div>
                    ) : null}
                  </div>

                  <div className="text-muted mt-2" style={{ fontSize: 13 }}>
                    Password will be stored securely (hashed).
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeCreate} disabled={savingCreate}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" disabled={savingCreate || (cPassword && cPassword2 && cPassword !== cPassword2)}>
                    {savingCreate ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* EDIT MODAL */}
      {editOpen ? (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={saveEdit}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit User</h5>
                  <button type="button" className="btn-close" onClick={closeEdit} />
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" value={eFullName} onChange={(e) => setEFullName(e.target.value)} required />
                  </div>

                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={eRole} onChange={(e) => setERole(e.target.value)}>
                        {CREATE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Branch</label>
                      <select className="form-select" value={eBranchId} onChange={(e) => setEBranchId(e.target.value)} required>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code ? `${b.code} - ${b.name}` : b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeEdit} disabled={savingEdit}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" disabled={savingEdit}>
                    {savingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {/* RESET PASSWORD MODAL */}
      {resetOpen ? (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={submitReset}>
                <div className="modal-header">
                  <h5 className="modal-title">Reset Password</h5>
                  <button type="button" className="btn-close" onClick={closeReset} />
                </div>

                <div className="modal-body">
                  <div className="mb-2 text-muted" style={{ fontSize: 13 }}>
                    User: <b>{resetUser?.fullName}</b> ({resetUser?.email})
                  </div>

                  <div className="mt-3">
                    <label className="form-label">New Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showRp1 ? "text" : "password"}
                        value={rp1}
                        onChange={(e) => setRp1(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        aria-label="Hold to show password"
                        title="Hold to show password"
                        {...holdShowHandlers(setShowRp1)}
                      >
                        <i className={showRp1 ? "bi bi-eye-slash" : "bi bi-eye"} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="form-label">Confirm New Password</label>
                    <div className="input-group">
                      <input
                        className="form-control"
                        type={showRp2 ? "text" : "password"}
                        value={rp2}
                        onChange={(e) => setRp2(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        aria-label="Hold to show password"
                        title="Hold to show password"
                        {...holdShowHandlers(setShowRp2)}
                      >
                        <i className={showRp2 ? "bi bi-eye-slash" : "bi bi-eye"} />
                      </button>
                    </div>

                    {rp2 && rp1 !== rp2 ? (
                      <div className="text-danger mt-1" style={{ fontSize: 13 }}>
                        Passwords do not match
                      </div>
                    ) : null}
                  </div>

                  <div className="text-muted mt-2" style={{ fontSize: 13 }}>
                    This sets a new password (stored as hashed). Share the temporary password securely with the user.
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeReset} disabled={resetting}>
                    Cancel
                  </button>
                  <button className="btn btn-warning" disabled={resetting || (rp1 && rp2 && rp1 !== rp2)}>
                    {resetting ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}