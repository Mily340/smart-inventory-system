// frontend/src/pages/Inventory.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const statusBadgeStyle = (status) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
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

export default function Inventory() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");

  const [qty, setQty] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";
  const assignedBranchNameFromSession = sessionStorage.getItem("branchName") || "";

  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchStaff = role === "BRANCH_STAFF";
  const isBranchScoped = isBranchManager || isBranchStaff;

  const activeBranches = useMemo(
    () => branches.filter((b) => b.isActive !== false),
    [branches]
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) || null,
    [branches, branchId]
  );

  const selectedBranchIsActive = selectedBranch ? selectedBranch.isActive !== false : true;

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

  const selectedInventoryRow = useMemo(
    () => inventory.find((r) => r.productId === productId) || null,
    [inventory, productId]
  );

  const selectedQty = Number(selectedInventoryRow?.quantity || 0);
  const selectedReorder = Number(selectedInventoryRow?.reorderLevel || 0);
  const selectedStatus = getStockStatus(selectedQty, selectedReorder);

  const stats = useMemo(() => {
    let totalQty = 0;
    let lowCount = 0;
    let outCount = 0;

    inventory.forEach((r) => {
      const q = Number(r.quantity) || 0;
      const rl = Number(r.reorderLevel) || 0;
      const status = getStockStatus(q, rl);

      totalQty += q;
      if (status.key === "LOW_STOCK") lowCount += 1;
      if (status.key === "OUT_OF_STOCK") outCount += 1;
    });

    return {
      totalItems: inventory.length,
      totalQty,
      lowCount,
      outCount,
    };
  }, [inventory]);

  const handleUnauthorized = (msg) => {
    if (String(msg || "").toLowerCase().includes("unauthorized")) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("fullName");
      sessionStorage.removeItem("branchId");
      sessionStorage.removeItem("branchName");
      sessionStorage.removeItem("branchIsActive");
      navigate("/login");
      return true;
    }

    return false;
  };

  const loadInventory = async (bId) => {
    if (!bId) {
      setInventory([]);
      return;
    }

    const branch = branches.find((b) => b.id === bId);

    if (branch && branch.isActive === false) {
      setInventory([]);
      setError("This branch is inactive. Please activate the branch before performing stock operations.");
      return;
    }

    const invRes = await client.get(`/inventory?branchId=${bId}`);
    const data = invRes.data?.data || [];

    data.sort((a, b) => {
      const nameA = a.product?.name || "";
      const nameB = b.product?.name || "";
      return nameA.localeCompare(nameB);
    });

    setInventory(data);
  };

  const fetchAll = async (selectedBranchId) => {
    setError("");
    setLoading(true);

    try {
      if (isBranchScoped && !assignedBranchId) {
        setError("No branch is assigned to this account. Please contact the administrator.");
        setBranches([]);
        setInventory([]);
        setLoading(false);
        return;
      }

      const [bRes, pRes] = await Promise.all([
        client.get("/branches"),
        client.get("/products"),
      ]);

      const allBranches = bRes.data?.data || [];
      const activeOnly = allBranches.filter((b) => b.isActive !== false);
      const p = pRes.data?.data || [];

      setBranches(isBranchScoped ? allBranches : activeOnly);
      setProducts(p);

      let nextBranchId = "";

      if (isBranchScoped) {
        nextBranchId = assignedBranchId;

        const assignedBranch = allBranches.find((b) => b.id === assignedBranchId);

        if (assignedBranch && assignedBranch.isActive === false) {
          sessionStorage.setItem("branchIsActive", "false");
          navigate("/branch-inactive", { replace: true });
          return;
        }
      } else {
        const currentBranchStillActive = activeOnly.some((b) => b.id === branchId);
        const selectedStillActive = activeOnly.some((b) => b.id === selectedBranchId);

        nextBranchId = selectedStillActive
          ? selectedBranchId
          : currentBranchStillActive
          ? branchId
          : activeOnly[0]?.id || "";
      }

      setBranchId(nextBranchId);

      const currentProductExists = p.some((x) => x.id === productId);
      const nextProductId = currentProductExists ? productId : p[0]?.id || "";
      setProductId(nextProductId);

      if (nextBranchId) {
        const invRes = await client.get(`/inventory?branchId=${nextBranchId}`);
        const data = invRes.data?.data || [];

        data.sort((a, b) => {
          const nameA = a.product?.name || "";
          const nameB = b.product?.name || "";
          return nameA.localeCompare(nameB);
        });

        setInventory(data);
      } else {
        setInventory([]);
        setError("No active branches available for inventory operations.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load inventory";
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

  const changeBranch = async (e) => {
    const id = e.target.value;
    setBranchId(id);
    setError("");
    setLoading(true);

    try {
      await loadInventory(id);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branch inventory";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  const qtyNum = Number(qty);
  const reorderNum = Number(reorderLevel);

  const canDoQty =
    branchId &&
    productId &&
    selectedBranchIsActive &&
    Number.isFinite(qtyNum) &&
    Number.isInteger(qtyNum) &&
    qtyNum > 0 &&
    !actionLoading;

  const canDoReorder =
    branchId &&
    productId &&
    selectedBranchIsActive &&
    Number.isFinite(reorderNum) &&
    Number.isInteger(reorderNum) &&
    reorderNum >= 0 &&
    !actionLoading;

  const checkActiveBranchBeforeAction = () => {
    const branch = branches.find((b) => b.id === branchId);

    if (branch && branch.isActive === false) {
      setError("This branch is inactive. Please activate the branch before performing stock operations.");
      return false;
    }

    return true;
  };

  const stockIn = async (e) => {
    e.preventDefault();
    setError("");

    if (!checkActiveBranchBeforeAction()) return;

    setActionLoading(true);

    try {
      await client.post("/inventory/stock-in", {
        branchId,
        productId,
        quantity: qtyNum,
        reason: "Frontend stock in",
      });

      setQty("");
      await fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Stock-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const stockOut = async (e) => {
    e.preventDefault();
    setError("");

    if (!checkActiveBranchBeforeAction()) return;

    setActionLoading(true);

    try {
      await client.post("/inventory/stock-out", {
        branchId,
        productId,
        quantity: qtyNum,
        reason: "Frontend stock out",
      });

      setQty("");
      await fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Stock-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const updateReorder = async (e) => {
    e.preventDefault();
    setError("");

    if (!checkActiveBranchBeforeAction()) return;

    setActionLoading(true);

    try {
      await client.patch("/inventory/reorder-level", {
        branchId,
        productId,
        reorderLevel: reorderNum,
      });

      setReorderLevel("");
      await fetchAll(branchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Update reorder level failed");
    } finally {
      setActionLoading(false);
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

  const branchLabel = selectedBranch
    ? `${selectedBranch.code ? `${selectedBranch.code} - ` : ""}${selectedBranch.name}`
    : assignedBranchNameFromSession || "-";

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h3 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Inventory
            </h3>
            <div className="text-muted" style={{ marginTop: 2, fontSize: 14 }}>
              {isBranchScoped
                ? "Manage stock operations for your assigned active branch."
                : "Manage stock operations, reorder levels, and active branch inventory."}
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <InfoPill
              color="#1D4ED8"
              bg="#EFF6FF"
              border="#BFDBFE"
              label="Branch"
              value={branchLabel}
            />

            <InfoPill
              color="#5B21B6"
              bg="#F5F3FF"
              border="#DDD6FE"
              label="Product"
              value={
                selectedProduct
                  ? `${selectedProduct.code ? `${selectedProduct.code} - ` : ""}${selectedProduct.name}`
                  : "-"
              }
            />

            <button
              className="btn btn-outline-secondary btn-sm"
              style={{
                borderRadius: 10,
                fontWeight: 700,
                padding: "6px 12px",
                background: "rgba(255,255,255,.85)",
              }}
              onClick={() => fetchAll(branchId)}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="alert alert-danger py-2 mb-2" style={{ borderRadius: 12 }}>
            {error}
          </div>
        ) : null}

        {selectedBranch && selectedBranch.isActive === false ? (
          <div className="alert alert-warning py-2 mb-2" style={{ borderRadius: 12 }}>
            This branch is inactive. Stock-in, stock-out, and reorder-level updates are disabled.
          </div>
        ) : null}

        <div className="card mb-3" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                  Select Branch & Product
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Choose an active branch and product before applying stock actions.
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
                {isBranchScoped ? "Branch locked" : "Active branches only"}
              </span>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            <div className="row g-2 align-items-end">
              <div className="col-12 col-lg-6">
                <label className="form-label small text-muted mb-1">Branch</label>

                {isBranchScoped ? (
                  <div
                    className="form-control form-control-sm"
                    style={{
                      ...inputStyle,
                      background: "#F8FAFC",
                      color: "#0F172A",
                      fontWeight: 700,
                    }}
                  >
                    {branchLabel}
                  </div>
                ) : (
                  <select
                    className="form-select form-select-sm"
                    style={inputStyle}
                    value={branchId}
                    onChange={changeBranch}
                    disabled={activeBranches.length === 0}
                  >
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code ? `${b.code} - ` : ""}
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="col-12 col-lg-6">
                <label className="form-label small text-muted mb-1">Product</label>
                <select
                  className="form-select form-select-sm"
                  style={inputStyle}
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={products.length === 0}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} - ` : ""}
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-2 mb-3">
          <SummaryCard
            title="Total Items"
            value={stats.totalItems}
            icon="bi-box-seam"
            hint="Products listed"
          />
          <SummaryCard
            title="Low Stock"
            value={stats.lowCount}
            icon="bi-exclamation-triangle"
            hint="At/below reorder"
          />
          <SummaryCard
            title="Out of Stock"
            value={stats.outCount}
            icon="bi-x-circle"
            hint="Zero quantity"
          />
          <SummaryCard
            title="Total Quantity"
            value={stats.totalQty}
            icon="bi-bar-chart"
            hint="Total stock"
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-12 col-xl-4">
            <div className="card h-100" style={panelStyle}>
              <div className="card-body py-2 px-3" style={headerCardStyle}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                  Selected Product
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Current stock condition.
                </div>
              </div>

              <div className="card-body py-2 px-3">
                <div className="mb-2">
                  <div className="text-muted small">Product</div>
                  <div style={{ fontWeight: 900, color: "#0F172A", fontSize: 14 }}>
                    {selectedProduct
                      ? `${selectedProduct.code ? `${selectedProduct.code} - ` : ""}${selectedProduct.name}`
                      : "-"}
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <MiniStat title="Quantity" value={selectedQty} />
                  <MiniStat title="Reorder" value={selectedReorder} />
                </div>

                <span style={statusBadgeStyle(selectedStatus.key)}>
                  <i className={`bi ${selectedStatus.icon}`}></i>
                  {selectedStatus.label}
                </span>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-8">
            <div className="card h-100" style={panelStyle}>
              <div className="card-body py-2 px-3" style={headerCardStyle}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                      Stock Actions
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      Apply stock-in, stock-out, or reorder-level updates.
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
                    Active branch required
                  </span>
                </div>
              </div>

              <div className="card-body py-2 px-3">
                <div className="row g-2 align-items-end">
                  <div className="col-12 col-lg-4">
                    <label className="form-label small text-muted mb-1">Quantity</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      placeholder="e.g., 10"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      inputMode="numeric"
                      disabled={!selectedBranchIsActive}
                    />
                  </div>

                  <div className="col-6 col-lg-4">
                    <form onSubmit={stockIn}>
                      <button
                        className="btn btn-success btn-sm w-100"
                        style={{ borderRadius: 10, fontWeight: 800, minHeight: 31 }}
                        type="submit"
                        disabled={!canDoQty}
                      >
                        <i className="bi bi-plus-circle me-1"></i>
                        Stock In
                      </button>
                    </form>
                  </div>

                  <div className="col-6 col-lg-4">
                    <form onSubmit={stockOut}>
                      <button
                        className="btn btn-danger btn-sm w-100"
                        style={{ borderRadius: 10, fontWeight: 800, minHeight: 31 }}
                        type="submit"
                        disabled={!canDoQty}
                      >
                        <i className="bi bi-dash-circle me-1"></i>
                        Stock Out
                      </button>
                    </form>
                  </div>
                </div>

                <hr className="my-2" />

                <form className="row g-2 align-items-end" onSubmit={updateReorder}>
                  <div className="col-12 col-lg-8">
                    <label className="form-label small text-muted mb-1">Reorder Level</label>
                    <input
                      className="form-control form-control-sm"
                      style={inputStyle}
                      placeholder="e.g., 5"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)}
                      inputMode="numeric"
                      disabled={!selectedBranchIsActive}
                    />
                  </div>

                  <div className="col-12 col-lg-4">
                    <button
                      className="btn btn-primary btn-sm w-100"
                      style={{ borderRadius: 10, fontWeight: 800, minHeight: 31 }}
                      type="submit"
                      disabled={!canDoReorder}
                    >
                      Update Reorder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                Inventory List
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${inventory.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            {loading ? (
              <div className="text-muted">Loading inventory...</div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-sm table-bordered table-hover align-middle mb-0"
                  style={{ fontSize: 13 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 110 }}>Code</th>
                      <th style={{ minWidth: 210 }}>Product</th>
                      <th style={{ minWidth: 140 }}>Category</th>
                      <th style={{ width: 85 }}>Unit</th>
                      <th style={{ width: 90 }}>Qty</th>
                      <th style={{ width: 110 }}>Reorder</th>
                      <th style={{ width: 135, textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventory.map((row) => {
                      const q = Number(row.quantity) || 0;
                      const rl = Number(row.reorderLevel) || 0;
                      const status = getStockStatus(q, rl);

                      return (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 800 }}>{row.product?.code || "-"}</td>
                          <td style={{ fontWeight: 800 }}>{row.product?.name || "-"}</td>
                          <td>{row.product?.category?.name || "-"}</td>
                          <td>{row.product?.unit || "-"}</td>
                          <td style={{ fontWeight: 900 }}>{q}</td>
                          <td>{rl}</td>
                          <td className="text-center">
                            <span style={statusBadgeStyle(status.key)}>
                              <i className={`bi ${status.icon}`}></i>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-3">
                          No inventory records found for this active branch.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
              Stock operations are available only for active branches. Historical inventory data can remain stored for inactive branches.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoPill({ label, value, bg, color, border }) {
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${border}`,
        padding: "5px 9px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 12,
        maxWidth: 250,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {label}: {value}
    </span>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-6 col-xl-3">
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

function MiniStat({ title, value }) {
  return (
    <div className="col-6">
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,.25)",
          background: "rgba(248,250,252,.9)",
          padding: "8px 10px",
        }}
      >
        <div className="text-muted" style={{ fontSize: 11.5, fontWeight: 700 }}>
          {title}
        </div>
        <div style={{ fontSize: 19, lineHeight: 1.1, fontWeight: 900, color: "#0F172A" }}>
          {value}
        </div>
      </div>
    </div>
  );
}