// frontend/src/pages/Users.jsx
import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import NavBar from "../components/NavBar";

const CREATE_ROLES = ["BRANCH_MANAGER", "INVENTORY_OFFICER", "BRANCH_STAFF", "DELIVERY_RIDER"];

const ALL_ROLES = [
  "SUPER_ADMIN",
  "BRANCH_MANAGER",
  "INVENTORY_OFFICER",
  "BRANCH_STAFF",
  "DELIVERY_RIDER",
];

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  BRANCH_MANAGER: "Branch Manager",
  INVENTORY_OFFICER: "Inventory Officer",
  BRANCH_STAFF: "Branch Staff",
  DELIVERY_RIDER: "Delivery Rider",
};

const roleBadgeStyle = (role) => {
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
    SUPER_ADMIN: {
      background: "#FEF2F2",
      color: "#B91C1C",
      borderColor: "#FECACA",
    },
    BRANCH_MANAGER: {
      background: "#EFF6FF",
      color: "#1D4ED8",
      borderColor: "#BFDBFE",
    },
    INVENTORY_OFFICER: {
      background: "#F5F3FF",
      color: "#5B21B6",
      borderColor: "#DDD6FE",
    },
    BRANCH_STAFF: {
      background: "#ECFDF5",
      color: "#047857",
      borderColor: "#A7F3D0",
    },
    DELIVERY_RIDER: {
      background: "#FFF7ED",
      color: "#C2410C",
      borderColor: "#FED7AA",
    },
  };

  return {
    ...base,
    ...(map[role] || {
      background: "#F3F4F6",
      color: "#374151",
      borderColor: "#E5E7EB",
    }),
  };
};

const smallActionBtnStyle = {
  borderRadius: 9,
  fontWeight: 800,
  padding: "5px 8px",
  fontSize: 12,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const stickyActionCellStyle = {
  position: "sticky",
  right: 0,
  zIndex: 2,
  background: "#fff",
  boxShadow: "-8px 0 14px rgba(15, 23, 42, 0.06)",
};

const stickyActionHeadStyle = {
  ...stickyActionCellStyle,
  zIndex: 3,
  background: "#f8f9fa",
};

const formatDateShort = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

function FloatingErrorToast({ error, onClose }) {
  if (!error) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        zIndex: 3000,
        width: "min(560px, calc(100vw - 32px))",
        borderRadius: 16,
        border: "1px solid #fecaca",
        background: "#fee2e2",
        color: "#7f1d1d",
        boxShadow: "0 16px 40px rgba(127, 29, 29, 0.18)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 15,
        fontWeight: 700,
      }}
    >
      <div className="d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle"></i>
        <span>{error}</span>
      </div>

      <button
        type="button"
        className="btn btn-sm"
        onClick={onClose}
        style={{
          border: "none",
          color: "#7f1d1d",
          fontWeight: 900,
          padding: "2px 6px",
          lineHeight: 1,
          fontSize: 20,
        }}
        aria-label="Close error"
      >
        ×
      </button>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

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

  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [eFullName, setEFullName] = useState("");
  const [eRole, setERole] = useState("BRANCH_STAFF");
  const [eBranchId, setEBranchId] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [rp1, setRp1] = useState("");
  const [rp2, setRp2] = useState("");
  const [showRp1, setShowRp1] = useState(false);
  const [showRp2, setShowRp2] = useState(false);

  const anyModalOpen = createOpen || editOpen || resetOpen;

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  const branchById = useMemo(() => {
    const m = new Map();
    branches.forEach((b) => m.set(b.id, b));
    return m;
  }, [branches]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      managers: users.filter((u) => u.role === "BRANCH_MANAGER").length,
      officers: users.filter((u) => u.role === "INVENTORY_OFFICER").length,
      staff: users.filter((u) => u.role === "BRANCH_STAFF").length,
      riders: users.filter((u) => u.role === "DELIVERY_RIDER").length,
    };
  }, [users]);

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      const [uRes, bRes] = await Promise.all([client.get("/users"), client.get("/branches")]);

      const u = uRes.data?.data || [];
      const br = bRes.data?.data || [];

      setUsers(u);
      setBranches(br);

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
    setError("");
    setCreateOpen(false);
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!cFullName.trim()) return setError("Full name is required");
    if (!cEmail.trim()) return setError("Email is required");
    if (!cPassword) return setError("Password is required");
    if (cPassword !== cPassword2) return setError("Passwords do not match");
    if (cRole === "SUPER_ADMIN") return setError("SUPER_ADMIN cannot be created from UI");
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
    if (u.role === "SUPER_ADMIN") return;

    setError("");
    setEditOpen(true);
    setEditId(u.id);
    setEFullName(u.fullName || "");
    setERole(CREATE_ROLES.includes(u.role) ? u.role : "BRANCH_STAFF");
    setEBranchId(u.branchId || branches[0]?.id || "");
  };

  const closeEdit = () => {
    if (savingEdit) return;

    setError("");
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
    if (u.role === "SUPER_ADMIN") return;

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
    if (u.role === "SUPER_ADMIN") return;

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

    setError("");
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

  const clearFilters = () => {
    setRoleFilter("");
    setBranchFilter("");
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
              Users
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              Manage role-based system users and branch assignments.
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: 10, fontWeight: 700, padding: "8px 14px" }}
              onClick={fetchAll}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>

            <button
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 10, fontWeight: 800, padding: "8px 14px" }}
              onClick={openCreate}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Create User
            </button>
          </div>
        </div>

        {error && !anyModalOpen ? (
          <div className="alert alert-danger" style={{ borderRadius: 14 }}>
            {error}
          </div>
        ) : null}

        <div className="row g-3 mb-4">
          <SummaryCard title="Total Users" value={summary.total} icon="bi-people" hint="All accounts" />
          <SummaryCard title="Managers" value={summary.managers} icon="bi-person-badge" hint="Branch managers" />
          <SummaryCard title="Officers" value={summary.officers} icon="bi-clipboard-data" hint="Inventory officers" />
          <SummaryCard title="Branch Staff" value={summary.staff} icon="bi-person-check" hint="Order users" />
          <SummaryCard title="Riders" value={summary.riders} icon="bi-truck" hint="Delivery riders" />
        </div>

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                  Filter Users
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  Search accounts by role and assigned branch.
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
                {filteredUsers.length} visible
              </span>
            </div>
          </div>

          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label small text-muted mb-1">Role</label>
                <select
                  className="form-select form-select-sm"
                  style={inputStyle}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r] || r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-lg-5">
                <label className="form-label small text-muted mb-1">Branch</label>
                <select
                  className="form-select form-select-sm"
                  style={inputStyle}
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
              </div>

              <div className="col-12 col-lg-3 d-grid">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={{ borderRadius: 12, fontWeight: 700, minHeight: 34 }}
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                User List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${filteredUsers.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading users...</div>
            ) : (
              <div
                className="table-responsive"
                style={{
                  overflowX: "auto",
                  borderRadius: 12,
                }}
              >
                <table
                  className="table table-sm table-bordered table-hover align-middle mb-0"
                  style={{ minWidth: 1080 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 80 }}>Code</th>
                      <th style={{ minWidth: 150 }}>Full Name</th>
                      <th style={{ minWidth: 220 }}>Email</th>
                      <th style={{ minWidth: 160 }}>Role</th>
                      <th style={{ minWidth: 180 }}>Branch</th>
                      <th style={{ width: 120 }}>Created</th>
                      <th style={{ width: 170, textAlign: "center", ...stickyActionHeadStyle }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((u) => {
                      const b = u.branchId ? branchById.get(u.branchId) : null;
                      const isSuperAdminRow = u.role === "SUPER_ADMIN";

                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 800 }}>{u.code || "-"}</td>
                          <td style={{ fontWeight: 800 }}>{u.fullName || "-"}</td>
                          <td>{u.email || "-"}</td>
                          <td>
                            <span style={roleBadgeStyle(u.role)}>
                              {ROLE_LABELS[u.role] || u.role}
                            </span>
                          </td>
                          <td>{b ? (b.code ? `${b.code} - ${b.name}` : b.name) : "-"}</td>
                          <td>{formatDateShort(u.createdAt)}</td>

                          <td className="text-center" style={stickyActionCellStyle}>
                            {isSuperAdminRow ? (
                              <span style={roleBadgeStyle("SUPER_ADMIN")}>
                                <i className="bi bi-shield-lock"></i>
                                Protected
                              </span>
                            ) : (
                              <div className="d-inline-flex gap-1 justify-content-center align-items-center">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  style={smallActionBtnStyle}
                                  onClick={() => openEdit(u)}
                                  title="Edit user"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  style={smallActionBtnStyle}
                                  onClick={() => openReset(u)}
                                  title="Reset password"
                                >
                                  <i className="bi bi-key"></i>
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  style={smallActionBtnStyle}
                                  onClick={() => deleteUser(u)}
                                  title="Delete user"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          No users found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              Actions remain visible on the right side of the table. Super Admin is protected and cannot be edited, reset, or deleted.
            </div>
          </div>
        </div>
      </div>

      {createOpen ? (
        <ModalFrame title="Create User" subtitle="Create a role-based account for a branch user." onClose={closeCreate}>
          <form onSubmit={createUser}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small text-muted mb-1">Full Name</label>
                  <input
                    className="form-control"
                    style={inputStyle}
                    value={cFullName}
                    onChange={(e) => setCFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label small text-muted mb-1">Email</label>
                  <input
                    className="form-control"
                    style={inputStyle}
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-muted mb-1">Role</label>
                  <select
                    className="form-select"
                    style={inputStyle}
                    value={cRole}
                    onChange={(e) => setCRole(e.target.value)}
                  >
                    {CREATE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Super Admin cannot be created here.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-muted mb-1">Branch</label>
                  <select
                    className="form-select"
                    style={inputStyle}
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

                <PasswordInput
                  label="Password"
                  value={cPassword}
                  setValue={setCPassword}
                  show={showPass1}
                  handlers={holdShowHandlers(setShowPass1)}
                />

                <PasswordInput
                  label="Confirm Password"
                  value={cPassword2}
                  setValue={setCPassword2}
                  show={showPass2}
                  handlers={holdShowHandlers(setShowPass2)}
                />

                {cPassword2 && cPassword !== cPassword2 ? (
                  <div className="col-12">
                    <div className="text-danger" style={{ fontSize: 13 }}>
                      Passwords do not match
                    </div>
                  </div>
                ) : null}

                <div className="col-12">
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Password will be stored securely as a hashed value.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ borderRadius: 10, fontWeight: 700 }}
                onClick={closeCreate}
                disabled={savingCreate}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                style={{ borderRadius: 10, fontWeight: 800 }}
                disabled={savingCreate || (cPassword && cPassword2 && cPassword !== cPassword2)}
              >
                {savingCreate ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {editOpen ? (
        <ModalFrame title="Edit User" subtitle="Update user name, role, and assigned branch." onClose={closeEdit}>
          <form onSubmit={saveEdit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small text-muted mb-1">Full Name</label>
                  <input
                    className="form-control"
                    style={inputStyle}
                    value={eFullName}
                    onChange={(e) => setEFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-muted mb-1">Role</label>
                  <select
                    className="form-select"
                    style={inputStyle}
                    value={eRole}
                    onChange={(e) => setERole(e.target.value)}
                  >
                    {CREATE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label small text-muted mb-1">Branch</label>
                  <select
                    className="form-select"
                    style={inputStyle}
                    value={eBranchId}
                    onChange={(e) => setEBranchId(e.target.value)}
                    required
                  >
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
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ borderRadius: 10, fontWeight: 700 }}
                onClick={closeEdit}
                disabled={savingEdit}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                style={{ borderRadius: 10, fontWeight: 800 }}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {resetOpen ? (
        <ModalFrame title="Reset Password" subtitle="Set a new temporary password for the selected user." onClose={closeReset}>
          <form onSubmit={submitReset}>
            <div className="modal-body">
              <div
                className="p-3 mb-3"
                style={{
                  borderRadius: 14,
                  background: "rgba(248,250,252,.9)",
                  border: "1px solid rgba(148,163,184,.25)",
                }}
              >
                <div className="text-muted" style={{ fontSize: 13 }}>
                  User
                </div>
                <div style={{ fontWeight: 900 }}>
                  {resetUser?.fullName}{" "}
                  <span className="text-muted" style={{ fontWeight: 500 }}>
                    ({resetUser?.email})
                  </span>
                </div>
              </div>

              <div className="row g-3">
                <PasswordInput
                  label="New Password"
                  value={rp1}
                  setValue={setRp1}
                  show={showRp1}
                  handlers={holdShowHandlers(setShowRp1)}
                />

                <PasswordInput
                  label="Confirm New Password"
                  value={rp2}
                  setValue={setRp2}
                  show={showRp2}
                  handlers={holdShowHandlers(setShowRp2)}
                />

                {rp2 && rp1 !== rp2 ? (
                  <div className="col-12">
                    <div className="text-danger" style={{ fontSize: 13 }}>
                      Passwords do not match
                    </div>
                  </div>
                ) : null}

                <div className="col-12">
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    Share the temporary password securely with the user.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                style={{ borderRadius: 10, fontWeight: 700 }}
                onClick={closeReset}
                disabled={resetting}
              >
                Cancel
              </button>

              <button
                className="btn btn-warning"
                style={{ borderRadius: 10, fontWeight: 800 }}
                disabled={resetting || (rp1 && rp2 && rp1 !== rp2)}
              >
                {resetting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      <FloatingErrorToast error={error} onClose={() => setError("")} />
    </>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-12 col-sm-6 col-xl">
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

            <div style={{ fontSize: 26, fontWeight: 900, color: "#0F172A" }}>
              {value}
            </div>

            <div className="text-muted" style={{ fontSize: 12 }}>
              {hint}
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: "rgba(219,234,254,.55)",
              border: "1px solid rgba(147,197,253,.55)",
              color: "#1D4ED8",
              fontSize: 17,
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

function PasswordInput({ label, value, setValue, show, handlers }) {
  return (
    <div className="col-12">
      <label className="form-label small text-muted mb-1">{label}</label>
      <div className="input-group">
        <input
          className="form-control"
          style={{ borderRadius: "12px 0 0 12px" }}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="new-password"
          required
        />

        <button
          type="button"
          className="btn btn-outline-secondary"
          style={{ borderRadius: "0 12px 12px 0" }}
          aria-label="Hold to show password"
          title="Hold to show password"
          {...handlers}
        >
          <i className={show ? "bi bi-eye-slash" : "bi bi-eye"} />
        </button>
      </div>
    </div>
  );
}

function ModalFrame({ title, subtitle, onClose, children }) {
  return (
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
            <div
              className="modal-header"
              style={{
                background:
                  "linear-gradient(180deg, rgba(219,234,254,.65), rgba(255,255,255,1))",
              }}
            >
              <div>
                <h5 className="modal-title" style={{ fontWeight: 900 }}>
                  {title}
                </h5>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {subtitle}
                </div>
              </div>

              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            {children}
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
}