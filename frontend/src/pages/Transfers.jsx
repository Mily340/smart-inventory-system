// frontend/src/pages/Transfers.jsx
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
    PENDING: { background: "#FFF7ED", color: "#9A3412", borderColor: "#FED7AA" },
    APPROVED: { background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" },
    REJECTED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    DISPATCHED: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    RECEIVED: { background: "#ECFEFF", color: "#0E7490", borderColor: "#A5F3FC" },
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
  const ok = type === "RECEIVED";

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

export default function Transfers() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInventoryOfficer = role === "INVENTORY_OFFICER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchStaff = role === "BRANCH_STAFF";

  const isTransferAdmin = isSuperAdmin || isInventoryOfficer;
  const isBranchScoped = isBranchManager || isBranchStaff;
  const canCreateTransfer = isTransferAdmin || isBranchManager;

  const finalToBranchId = isBranchManager ? assignedBranchId : toBranchId;

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

  const getBranchLabel = (id) => {
    const b = branches.find((x) => x.id === id);
    if (!b) return id ? "Assigned Branch" : "-";
    return `${b.code ? `${b.code} - ` : ""}${b.name}`;
  };

  const availableFromBranches = useMemo(() => {
    return branches.filter((b) => b.id !== finalToBranchId);
  }, [branches, finalToBranchId]);

  const assignedBranchName = useMemo(() => {
    const b = branches.find((x) => x.id === assignedBranchId);
    return b ? `${b.code ? `${b.code} - ` : ""}${b.name}` : "Assigned Branch";
  }, [branches, assignedBranchId]);

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      if (isBranchScoped && !assignedBranchId) {
        setError("No branch is assigned to this account. Please contact the administrator.");
        setTransfers([]);
        setLoading(false);
        return;
      }

      const [bRes, pRes, tRes] = await Promise.all([
        client.get("/branches"),
        client.get("/products"),
        client.get("/transfers"),
      ]);

      const b = bRes.data?.data || [];
      const p = pRes.data?.data || [];
      const t = tRes.data?.data || [];

      setBranches(b);
      setProducts(p);
      setTransfers(t);

      if (!productId && p.length > 0) {
        setProductId(p[0].id);
      }

      if (isBranchManager) {
        setToBranchId(assignedBranchId);

        const firstSourceBranch = b.find((branch) => branch.id !== assignedBranchId);
        if (!fromBranchId && firstSourceBranch) {
          setFromBranchId(firstSourceBranch.id);
        }

        if (fromBranchId === assignedBranchId && firstSourceBranch) {
          setFromBranchId(firstSourceBranch.id);
        }
      } else {
        if (!fromBranchId && b.length > 0) {
          setFromBranchId(b[0].id);
        }

        if (!toBranchId && b.length > 1) {
          setToBranchId(b[1].id);
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load transfers";
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

  useEffect(() => {
    if (!isBranchManager) return;

    setToBranchId(assignedBranchId);

    if (fromBranchId === assignedBranchId) {
      const firstSourceBranch = branches.find((b) => b.id !== assignedBranchId);
      setFromBranchId(firstSourceBranch?.id || "");
    }
  }, [assignedBranchId, branches, fromBranchId, isBranchManager]);

  const createTransfer = async (e) => {
    e.preventDefault();
    setError("");

    if (!canCreateTransfer) {
      setError("You do not have permission to create transfer requests.");
      return;
    }

    if (!fromBranchId || !finalToBranchId || !productId) {
      setError("Please select source branch, receiving branch, and product.");
      return;
    }

    if (fromBranchId === finalToBranchId) {
      setError("From and To branch cannot be the same.");
      return;
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive integer.");
      return;
    }

    try {
      await client.post("/transfers", {
        fromBranchId,
        toBranchId: finalToBranchId,
        items: [{ productId, quantity: qty }],
      });

      setQuantity("");
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create transfer");
    }
  };

  const action = async (id, type) => {
    setError("");

    try {
      await client.patch(`/transfers/${id}/${type}`);
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Action failed");
    }
  };

  const renderActions = (t) => {
    if (t.status === "RECEIVED") {
      return (
        <span style={finalIconStyle("RECEIVED")} title="Received">
          <i className="bi bi-check-lg"></i>
        </span>
      );
    }

    if (t.status === "REJECTED") {
      return (
        <span style={finalIconStyle("REJECTED")} title="Rejected">
          <i className="bi bi-x-lg"></i>
        </span>
      );
    }

    if (isBranchStaff) {
      return <span className="text-muted">—</span>;
    }

    if (isTransferAdmin && t.status === "PENDING") {
      return (
        <div className="d-flex gap-2 flex-wrap justify-content-center">
          <button
            className="btn btn-sm btn-outline-success"
            style={{ borderRadius: 10, fontWeight: 700 }}
            onClick={() => action(t.id, "approve")}
          >
            Approve
          </button>

          <button
            className="btn btn-sm btn-outline-danger"
            style={{ borderRadius: 10, fontWeight: 700 }}
            onClick={() => action(t.id, "reject")}
          >
            Reject
          </button>
        </div>
      );
    }

    if (isTransferAdmin && t.status === "APPROVED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 10, fontWeight: 700 }}
          onClick={() => action(t.id, "dispatch")}
        >
          Dispatch
        </button>
      );
    }

    if (t.status === "DISPATCHED") {
      const canReceive =
        isTransferAdmin || (isBranchManager && t.toBranchId === assignedBranchId);

      if (canReceive) {
        return (
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: 10, fontWeight: 700 }}
            onClick={() => action(t.id, "receive")}
          >
            Receive
          </button>
        );
      }
    }

    if (isBranchManager && t.status === "PENDING") {
      return <span className="text-muted small">Awaiting approval</span>;
    }

    if (isBranchManager && t.status === "APPROVED") {
      return <span className="text-muted small">Awaiting dispatch</span>;
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
              Transfers
            </h2>

            <div className="text-muted" style={{ marginTop: 4 }}>
              {isBranchManager
                ? "Create transfer requests for your assigned branch only."
                : "Create and track stock transfer requests between branches."}
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

        {canCreateTransfer ? (
          <div className="card mb-4" style={panelStyle}>
            <div className="card-body" style={headerCardStyle}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                    Create Transfer Request
                  </div>
                  <div className="text-muted" style={{ fontSize: 13 }}>
                    {isBranchManager
                      ? "Receiving branch is locked to your assigned branch."
                      : "Select source branch, receiving branch, product, and quantity."}
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
                  1 item per request
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="small text-muted mb-3">
                <strong>Request From:</strong> {getBranchLabel(fromBranchId)}{" "}
                <strong className="mx-2">→</strong>
                <strong>Request To:</strong>{" "}
                {isBranchManager ? assignedBranchName : getBranchLabel(toBranchId)}
              </div>

              <form onSubmit={createTransfer} className="row g-2 align-items-end">
                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted mb-1">Request From</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: 12 }}
                    value={fromBranchId}
                    onChange={(e) => setFromBranchId(e.target.value)}
                    required
                  >
                    {(isBranchManager ? availableFromBranches : branches).map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code ? `${b.code} - ` : ""}
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted mb-1">Request To</label>

                  {isBranchManager ? (
                    <div
                      className="form-control"
                      style={{
                        borderRadius: 12,
                        background: "#F8FAFC",
                        color: "#0F172A",
                        fontWeight: 700,
                      }}
                    >
                      {assignedBranchName}
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      style={{ borderRadius: 12 }}
                      value={toBranchId}
                      onChange={(e) => setToBranchId(e.target.value)}
                      required
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code ? `${b.code} - ` : ""}
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="col-12 col-md-3">
                  <label className="form-label small text-muted mb-1">Product</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: 12 }}
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code ? `${p.code} - ` : ""}
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-8 col-md-1">
                  <label className="form-label small text-muted mb-1">Qty</label>
                  <input
                    className="form-control"
                    style={{ borderRadius: 12 }}
                    placeholder="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="col-4 col-md-2 d-grid">
                  <button
                    className="btn btn-primary"
                    style={{
                      borderRadius: 12,
                      fontWeight: 800,
                      padding: "10px 12px",
                    }}
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
                {isBranchScoped ? "Branch Transfers" : "Recent Transfers"}
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${transfers.length} record(s)`}
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
                      <th style={{ width: 90, textAlign: "center" }}>ID</th>
                      <th style={{ minWidth: 170 }}>Request From</th>
                      <th style={{ minWidth: 170 }}>Request To</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ minWidth: 280 }}>Items</th>
                      <th style={{ width: 190, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transfers.map((t, index) => (
                      <tr key={t.id}>
                        <td
                          style={{
                            width: 90,
                            fontWeight: 900,
                            textAlign: "center",
                            color: "#0F172A",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        <td>
                          {t.fromBranch?.code ? `${t.fromBranch.code} - ` : ""}
                          {t.fromBranch?.name || "-"}
                        </td>

                        <td>
                          {t.toBranch?.code ? `${t.toBranch.code} - ` : ""}
                          {t.toBranch?.name || "-"}
                        </td>

                        <td>
                          <span style={badgeStyle(t.status)}>{t.status}</span>
                        </td>

                        <td>
                          {t.items?.length ? (
                            t.items.map((it) => (
                              <div key={it.id} style={{ lineHeight: 1.35 }}>
                                <span style={{ fontWeight: 700 }}>
                                  {it.product?.code ? `${it.product.code} - ` : ""}
                                  {it.product?.name}
                                </span>{" "}
                                <span className="text-muted">x {it.quantity}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td className="text-center">{renderActions(t)}</td>
                      </tr>
                    ))}

                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No transfers found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              {isBranchManager
                ? "Branch Manager can request and receive transfers only for the assigned branch."
                : isBranchStaff
                ? "Branch Staff can view branch transfers only."
                : isTransferAdmin
                ? "Admin Staff can approve, reject, dispatch, and receive transfer requests."
                : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}