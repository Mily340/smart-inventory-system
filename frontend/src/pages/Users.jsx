import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const ROLES = ["SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER", "DELIVERY_RIDER"];

export default function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState("INVENTORY_OFFICER");
  const [editBranchId, setEditBranchId] = useState("");

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      const [bRes] = await Promise.all([client.get("/branches")]);
      const b = bRes.data?.data || [];
      setBranches(b);

      const qs = new URLSearchParams();
      if (roleFilter) qs.set("role", roleFilter);
      if (branchFilter) qs.set("branchId", branchFilter);

      const uRes = await client.get(`/users${qs.toString() ? `?${qs}` : ""}`);
      setUsers(uRes.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load users";
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
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, branchFilter]);

  const openEdit = (u) => {
    setError("");

    // Safety: do not allow editing SUPER_ADMIN
    if (u.role === "SUPER_ADMIN") {
      setError("SUPER_ADMIN cannot be modified.");
      return;
    }

    setEditId(u.id);
    setEditFullName(u.fullName || "");
    setEditRole(u.role || "INVENTORY_OFFICER");
    setEditBranchId(u.branchId || "");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
    setEditId("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // For non-admin roles, branchId should be set
      if (editRole !== "SUPER_ADMIN" && !editBranchId) {
        setError("branch is required for non-admin users");
        setSaving(false);
        return;
      }

      await client.patch(`/users/${editId}`, {
        fullName: editFullName,
        role: editRole,
        branchId: editRole === "SUPER_ADMIN" ? null : editBranchId,
      });

      setEditOpen(false);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (u) => {
    setError("");

    // Safety: do not allow deleting SUPER_ADMIN
    if (u.role === "SUPER_ADMIN") {
      setError("SUPER_ADMIN cannot be deleted.");
      return;
    }

    const ok = window.confirm("Delete this user?");
    if (!ok) return;

    try {
      await client.delete(`/users/${u.id}`);
      fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <>
      <NavBar />

      <div className="container" style={{ marginTop: 40 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Users</h4>

          <div className="d-flex gap-2">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code ? `${b.code} - ` : ""}
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Created</th>
                  <th style={{ width: 170 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.code || "-"}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.branch?.name || "-"}</td>
                    <td>{new Date(u.createdAt).toLocaleString()}</td>

                    <td>
                      {u.role === "SUPER_ADMIN" ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openEdit(u)}
                          >
                            Edit
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
                ))}

                {users.length === 0 ? (
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

      {/* Edit Modal */}
      {editOpen ? (
        <>
          <div className="modal show" style={{ display: "block" }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={saveEdit}>
                  <div className="modal-header">
                    <h5 className="modal-title">Edit User</h5>
                    <button type="button" className="btn-close" onClick={closeEdit} />
                  </div>

                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Full Name</label>
                      <input
                        className="form-control"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-2">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-2">
                      <label className="form-label">Branch</label>
                      <select
                        className="form-select"
                        value={editBranchId || ""}
                        onChange={(e) => setEditBranchId(e.target.value)}
                        disabled={editRole === "SUPER_ADMIN"}
                        required={editRole !== "SUPER_ADMIN"}
                      >
                        <option value="">Select branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code ? `${b.code} - ` : ""}
                            {b.name}
                          </option>
                        ))}
                      </select>
                      {editRole === "SUPER_ADMIN" ? (
                        <div className="form-text">SUPER_ADMIN does not require a branch.</div>
                      ) : null}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeEdit}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
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