// frontend/src/pages/BranchStock.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const statusBadgeStyle = (status) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const map = {
    IN_STOCK: {
      background: "#ECFDF5",
      color: "#047857",
      borderColor: "#A7F3D0",
    },
    LOW_STOCK: {
      background: "#FFF7ED",
      color: "#C2410C",
      borderColor: "#FED7AA",
    },
    OUT_OF_STOCK: {
      background: "#FEF2F2",
      color: "#B91C1C",
      borderColor: "#FECACA",
    },
  };

  return {
    ...base,
    ...(map[status] || {
      background: "#F3F4F6",
      color: "#374151",
      borderColor: "#E5E7EB",
    }),
  };
};

const getStockStatus = (qty, reorderLevel) => {
  if (qty <= 0) {
    return {
      key: "OUT_OF_STOCK",
      label: "Out of Stock",
      icon: "bi-x-circle",
    };
  }

  if (reorderLevel > 0 && qty <= reorderLevel) {
    return {
      key: "LOW_STOCK",
      label: "Low Stock",
      icon: "bi-exclamation-triangle",
    };
  }

  return {
    key: "IN_STOCK",
    label: "In Stock",
    icon: "bi-check-circle",
  };
};

export default function BranchStock() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";

  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchStaff = role === "BRANCH_STAFF";
  const isBranchScoped = isBranchManager || isBranchStaff;

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId),
    [branches, branchId]
  );

  const summary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    items.forEach((it) => {
      const qty = Number(it.quantity || 0);
      const reorderLevel = Number(it.reorderLevel || 0);
      const status = getStockStatus(qty, reorderLevel);

      if (status.key === "IN_STOCK") inStock += 1;
      if (status.key === "LOW_STOCK") lowStock += 1;
      if (status.key === "OUT_OF_STOCK") outOfStock += 1;
    });

    return {
      total: items.length,
      inStock,
      lowStock,
      outOfStock,
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

  const fetchBranches = async () => {
    const res = await client.get("/branches");
    const data = res.data?.data || [];

    setBranches(data);

    if (isBranchScoped) {
      if (!assignedBranchId) {
        throw new Error("No branch is assigned to this account.");
      }

      setBranchId(assignedBranchId);
      return assignedBranchId;
    }

    const nextBranchId = branchId || data[0]?.id || "";
    if (!branchId && nextBranchId) setBranchId(nextBranchId);

    return nextBranchId;
  };

  const fetchInventory = async (bId) => {
    if (!bId) return;

    const res = await client.get(`/inventory?branchId=${bId}`);
    const data = res.data?.data || [];

    data.sort((a, b) => {
      const nameA = a.product?.name || "";
      const nameB = b.product?.name || "";
      return nameA.localeCompare(nameB);
    });

    setItems(data);
  };

  const load = async () => {
    setError("");
    setLoading(true);

    try {
      const nextBranchId = await fetchBranches();

      if (nextBranchId) {
        await fetchInventory(nextBranchId);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to load branch stock";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!branchId) return;

    (async () => {
      setError("");
      setLoading(true);

      try {
        await fetchInventory(branchId);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load branch stock";
        setError(msg);
        handleUnauthorized(msg);
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

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

  const summaryCardStyle = {
    borderRadius: 14,
    border: "1px solid rgba(148,163,184,.28)",
    boxShadow: "0 5px 13px rgba(15,23,42,.04)",
    background: "rgba(255,255,255,.88)",
    padding: "10px 14px",
    minHeight: 82,
  };

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h3 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Branch Stock
            </h3>
            <div className="text-muted" style={{ marginTop: 2, fontSize: 14 }}>
              {isBranchScoped
                ? "View stock availability for your assigned branch."
                : "Monitor branch-wise product stock, reorder levels, and stock status."}
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
            onClick={load}
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

        <div className="card mb-3" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                  Stock Overview
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {selectedBranch
                    ? `Currently viewing: ${selectedBranch.code ? `${selectedBranch.code} - ` : ""}${selectedBranch.name}`
                    : "Select a branch to view stock information."}
                </div>
              </div>

              <div style={{ minWidth: 280 }}>
                {isBranchScoped ? (
                  <div
                    className="form-control form-control-sm"
                    style={{
                      borderRadius: 10,
                      background: "#F8FAFC",
                      color: "#0F172A",
                      fontWeight: 700,
                    }}
                  >
                    {selectedBranch
                      ? `${selectedBranch.code ? `${selectedBranch.code} - ` : ""}${selectedBranch.name}`
                      : "Assigned Branch"}
                  </div>
                ) : (
                  <select
                    className="form-select form-select-sm"
                    style={{ borderRadius: 10 }}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
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
            </div>
          </div>

          <div className="card-body py-2 px-3">
            <div className="row g-2">
              <SummaryCard
                title="Total Items"
                value={summary.total}
                icon="bi-box-seam"
                hint="Products stocked"
                style={summaryCardStyle}
              />
              <SummaryCard
                title="In Stock"
                value={summary.inStock}
                icon="bi-check-circle"
                hint="Healthy quantity"
                style={summaryCardStyle}
              />
              <SummaryCard
                title="Low Stock"
                value={summary.lowStock}
                icon="bi-exclamation-triangle"
                hint="Needs attention"
                style={summaryCardStyle}
              />
              <SummaryCard
                title="Out of Stock"
                value={summary.outOfStock}
                icon="bi-x-circle"
                hint="No quantity available"
                style={summaryCardStyle}
              />
            </div>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Stock List
              </div>
              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${items.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            {loading ? (
              <div className="text-muted">Loading branch stock...</div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-sm table-bordered table-hover align-middle mb-0"
                  style={{ fontSize: 13 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 125 }}>Product Code</th>
                      <th style={{ minWidth: 220 }}>Product</th>
                      <th style={{ minWidth: 140 }}>Category</th>
                      <th style={{ width: 85 }}>Unit</th>
                      <th style={{ width: 125 }}>Qty Available</th>
                      <th style={{ width: 135 }}>Reorder Level</th>
                      <th style={{ width: 130, textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((it) => {
                      const qty = Number(it.quantity || 0);
                      const reorderLevel = Number(it.reorderLevel || 0);
                      const status = getStockStatus(qty, reorderLevel);

                      return (
                        <tr key={it.id}>
                          <td style={{ fontWeight: 800 }}>{it.product?.code || "-"}</td>
                          <td>{it.product?.name || "-"}</td>
                          <td>{it.product?.category?.name || "-"}</td>
                          <td>{it.product?.unit || "-"}</td>
                          <td style={{ fontWeight: 900 }}>{qty}</td>
                          <td>{reorderLevel}</td>
                          <td className="text-center">
                            <span style={statusBadgeStyle(status.key)}>
                              <i className={`bi ${status.icon} me-1`}></i>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-3">
                          No inventory found for this branch. Stock in products first.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
              Stock status is calculated using quantity and reorder level. “Low Stock” appears when available quantity is equal to or below the reorder level.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ title, value, icon, hint, style }) {
  return (
    <div className="col-6 col-xl-3">
      <div style={style} className="h-100">
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