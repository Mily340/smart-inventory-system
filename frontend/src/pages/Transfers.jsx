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
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
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
    width: 28,
    height: 28,
    borderRadius: "50%",
    fontSize: 14,
    fontWeight: 900,
    border: ok ? "1px solid #A7F3D0" : "1px solid #FECACA",
    background: ok ? "#ECFDF5" : "#FEF2F2",
    color: ok ? "#047857" : "#B91C1C",
  };
};

const actionBtnStyle = {
  borderRadius: 8,
  fontWeight: 700,
  padding: "4px 8px",
  fontSize: 12,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

export default function Transfers() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [branchInventory, setBranchInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState("");

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";
  const assignedBranchNameFromSession = sessionStorage.getItem("branchName") || "";

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInventoryOfficer = role === "INVENTORY_OFFICER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchStaff = role === "BRANCH_STAFF";

  const isTransferAdmin = isSuperAdmin || isInventoryOfficer;
  const isBranchScoped = isBranchManager || isBranchStaff;
  const canCreateTransfer = isTransferAdmin || isBranchManager;

  const activeBranches = useMemo(
    () => branches.filter((b) => b.isActive !== false),
    [branches]
  );

  const assignedBranch = useMemo(
    () => branches.find((b) => b.id === assignedBranchId) || null,
    [branches, assignedBranchId]
  );

  const assignedBranchIsActive = assignedBranch ? assignedBranch.isActive !== false : true;
  const finalToBranchId = isBranchManager ? assignedBranchId : toBranchId;

  const inventoryMap = useMemo(() => {
    const map = new Map();

    branchInventory.forEach((row) => {
      const pid = row.productId || row.product?.id;
      if (!pid) return;

      map.set(pid, {
        quantity: Number(row.quantity || 0),
        reorderLevel: Number(row.reorderLevel || 0),
      });
    });

    return map;
  }, [branchInventory]);

  const productOptions = useMemo(() => {
    return products
      .map((p) => {
        const inv = inventoryMap.get(p.id);
        const availableQty = Number(inv?.quantity || 0);

        return {
          ...p,
          availableQty,
        };
      })
      .sort((a, b) => {
        if (b.availableQty !== a.availableQty) return b.availableQty - a.availableQty;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [products, inventoryMap]);

  const selectedProduct = useMemo(
    () => productOptions.find((p) => p.id === productId) || null,
    [productOptions, productId]
  );

  const selectedProductAvailable = selectedProduct ? Number(selectedProduct.availableQty || 0) : 0;

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

  const getBranchLabel = (id) => {
    const b = branches.find((x) => x.id === id);
    if (!b) return id ? "Assigned Branch" : "-";

    const statusText = b.isActive === false ? " (Inactive)" : "";
    return `${b.code ? `${b.code} - ` : ""}${b.name}${statusText}`;
  };

  const getProductLabel = (id) => {
    const p = products.find((x) => x.id === id);
    if (!p) return "Product";

    return `${p.code ? `${p.code} - ` : ""}${p.name}`;
  };

  const getAvailableQty = (id) => {
    return Number(inventoryMap.get(id)?.quantity || 0);
  };

  const activeFromBranches = useMemo(() => {
    return activeBranches.filter((b) => b.id !== finalToBranchId);
  }, [activeBranches, finalToBranchId]);

  const activeToBranches = useMemo(() => {
    return activeBranches.filter((b) => b.id !== fromBranchId);
  }, [activeBranches, fromBranchId]);

  const assignedBranchName = useMemo(() => {
    if (assignedBranch) {
      return `${assignedBranch.code ? `${assignedBranch.code} - ` : ""}${assignedBranch.name}`;
    }

    return assignedBranchNameFromSession || "Assigned Branch";
  }, [assignedBranch, assignedBranchNameFromSession]);

  const fetchBranchInventory = async (branchId) => {
    if (!branchId) {
      setBranchInventory([]);
      return;
    }

    setInventoryLoading(true);

    try {
      const res = await client.get(`/inventory?branchId=${branchId}`);
      setBranchInventory(res.data?.data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branch inventory";
      setError(msg);
      handleUnauthorized(msg);
      setBranchInventory([]);
    } finally {
      setInventoryLoading(false);
    }
  };

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

      const allBranches = bRes.data?.data || [];
      const activeOnly = allBranches.filter((b) => b.isActive !== false);
      const p = pRes.data?.data || [];
      const t = tRes.data?.data || [];

      setBranches(allBranches);
      setProducts(p);
      setTransfers(t);

      if (!productId && p.length > 0) {
        setProductId(p[0].id);
      }

      if (isBranchManager) {
        const assigned = allBranches.find((b) => b.id === assignedBranchId);

        if (assigned && assigned.isActive === false) {
          sessionStorage.setItem("branchIsActive", "false");
          navigate("/branch-inactive", { replace: true });
          return;
        }

        setToBranchId(assignedBranchId);

        const activeSourceBranches = activeOnly.filter((branch) => branch.id !== assignedBranchId);
        const currentFromStillActive = activeSourceBranches.some(
          (branch) => branch.id === fromBranchId
        );

        if (!currentFromStillActive) {
          setFromBranchId(activeSourceBranches[0]?.id || "");
          setSelectedItems([]);
        }
      } else {
        const currentFromStillActive = activeOnly.some((branch) => branch.id === fromBranchId);
        const nextFromBranchId =
          currentFromStillActive && fromBranchId ? fromBranchId : activeOnly[0]?.id || "";

        const possibleToBranches = activeOnly.filter((branch) => branch.id !== nextFromBranchId);
        const currentToStillActive = possibleToBranches.some((branch) => branch.id === toBranchId);
        const nextToBranchId =
          currentToStillActive && toBranchId ? toBranchId : possibleToBranches[0]?.id || "";

        setFromBranchId(nextFromBranchId);
        setToBranchId(nextToBranchId);

        if (activeOnly.length < 2) {
          setError("At least two active branches are required to create a transfer request.");
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
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 6000);

    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!fromBranchId) return;
    fetchBranchInventory(fromBranchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromBranchId]);

  useEffect(() => {
    if (productOptions.length === 0) {
      setProductId("");
      return;
    }

    const stillExists = productOptions.some((p) => p.id === productId);
    if (!stillExists) {
      const firstAvailable = productOptions.find((p) => p.availableQty > 0);
      setProductId(firstAvailable?.id || productOptions[0].id);
    }
  }, [productOptions, productId]);

  useEffect(() => {
    if (!isBranchManager) return;

    setToBranchId(assignedBranchId);

    if (fromBranchId === assignedBranchId) {
      const firstSourceBranch = activeBranches.find((b) => b.id !== assignedBranchId);
      setFromBranchId(firstSourceBranch?.id || "");
      setSelectedItems([]);
    }
  }, [assignedBranchId, activeBranches, fromBranchId, isBranchManager]);

  useEffect(() => {
    if (isBranchManager) return;
    if (!fromBranchId) return;
    if (toBranchId && toBranchId !== fromBranchId) return;

    const firstToBranch = activeBranches.find((b) => b.id !== fromBranchId);
    setToBranchId(firstToBranch?.id || "");
  }, [fromBranchId, toBranchId, activeBranches, isBranchManager]);

  const handleFromBranchChange = (value) => {
    setFromBranchId(value);
    setSelectedItems([]);
    setQuantity("");
  };

  const handleToBranchChange = (value) => {
    setToBranchId(value);
    setSelectedItems([]);
    setQuantity("");
  };

  const addTransferItem = () => {
    setError("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive integer.");
      return;
    }

    const product = products.find((p) => p.id === productId);

    if (!product) {
      setError("Selected product is invalid.");
      return;
    }

    const availableQty = getAvailableQty(productId);
    const alreadySelectedQty = selectedItems
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (availableQty <= 0) {
      setError("Selected product has no available stock in the source branch.");
      return;
    }

    if (alreadySelectedQty + qty > availableQty) {
      setError(
        `Requested quantity exceeds available stock. Available: ${availableQty}, already selected: ${alreadySelectedQty}.`
      );
      return;
    }

    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);

      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + qty,
                availableQty,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          productId,
          quantity: qty,
          availableQty,
          label: getProductLabel(productId),
        },
      ];
    });

    setQuantity("");
  };

  const removeTransferItem = (id) => {
    setSelectedItems((prev) => prev.filter((item) => item.productId !== id));
  };

  const clearTransferItems = () => {
    setSelectedItems([]);
    setQuantity("");
  };

  const createTransfer = async (e) => {
    e.preventDefault();
    setError("");

    if (!canCreateTransfer) {
      setError("You do not have permission to create transfer requests.");
      return;
    }

    if (isBranchManager && !assignedBranchIsActive) {
      setError("Your assigned branch is inactive. Transfer request cannot be created.");
      return;
    }

    const fromBranch = branches.find((b) => b.id === fromBranchId);
    const toBranch = branches.find((b) => b.id === finalToBranchId);

    if (fromBranch && fromBranch.isActive === false) {
      setError("Source branch is inactive. Please select an active branch.");
      return;
    }

    if (toBranch && toBranch.isActive === false) {
      setError("Receiving branch is inactive. Please select an active branch.");
      return;
    }

    if (!fromBranchId || !finalToBranchId) {
      setError("Please select source branch and receiving branch.");
      return;
    }

    if (fromBranchId === finalToBranchId) {
      setError("From and To branch cannot be the same.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Please add at least one product to the transfer request.");
      return;
    }

    for (const item of selectedItems) {
      const currentAvailableQty = getAvailableQty(item.productId);

      if (Number(item.quantity || 0) > currentAvailableQty) {
        setError(
          `${item.label} exceeds available stock. Available: ${currentAvailableQty}, selected: ${item.quantity}.`
        );
        return;
      }
    }

    try {
      await client.post("/transfers", {
        fromBranchId,
        toBranchId: finalToBranchId,
        items: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      setQuantity("");
      setSelectedItems([]);
      await fetchAll();
      await fetchBranchInventory(fromBranchId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create transfer");
    }
  };

  const action = async (id, type) => {
    setError("");

    try {
      await client.patch(`/transfers/${id}/${type}`);
      await fetchAll();
      if (fromBranchId) await fetchBranchInventory(fromBranchId);
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
        <div className="d-flex gap-1 flex-wrap justify-content-center">
          <button
            className="btn btn-sm btn-outline-success"
            style={actionBtnStyle}
            onClick={() => action(t.id, "approve")}
          >
            Approve
          </button>

          <button
            className="btn btn-sm btn-outline-danger"
            style={actionBtnStyle}
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
          style={actionBtnStyle}
          onClick={() => action(t.id, "dispatch")}
        >
          Dispatch
        </button>
      );
    }

    if (t.status === "DISPATCHED") {
      const canReceive = isTransferAdmin || (isBranchManager && t.toBranchId === assignedBranchId);

      if (canReceive) {
        return (
          <button
            className="btn btn-sm btn-outline-secondary"
            style={actionBtnStyle}
            onClick={() => action(t.id, "receive")}
          >
            Receive
          </button>
        );
      }
    }

    if (isBranchManager && t.status === "PENDING") {
      return <span className="text-muted" style={{ fontSize: 11.5 }}>Awaiting approval</span>;
    }

    if (isBranchManager && t.status === "APPROVED") {
      return <span className="text-muted" style={{ fontSize: 11.5 }}>Awaiting dispatch</span>;
    }

    return <span className="text-muted">—</span>;
  };

  const canSubmitTransfer =
    canCreateTransfer &&
    fromBranchId &&
    finalToBranchId &&
    fromBranchId !== finalToBranchId &&
    selectedItems.length > 0 &&
    activeBranches.length >= 2 &&
    (!isBranchManager || assignedBranchIsActive);

  const canAddItem =
    canCreateTransfer &&
    fromBranchId &&
    finalToBranchId &&
    fromBranchId !== finalToBranchId &&
    productId &&
    selectedProductAvailable > 0 &&
    activeBranches.length >= 2 &&
    (!isBranchManager || assignedBranchIsActive);

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

  return (
    <>
      <NavBar />

      <div className="container-fluid px-4" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h3 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Transfers
            </h3>

            <div className="text-muted" style={{ marginTop: 2, fontSize: 14 }}>
              {isBranchManager
                ? "Create transfer requests for your assigned active branch only."
                : "Create and track stock transfer requests between active branches."}
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
            onClick={fetchAll}
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

        {canCreateTransfer ? (
          <div className="card mb-3" style={panelStyle}>
            <div className="card-body py-2 px-3" style={headerCardStyle}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                    Create Transfer Request
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {isBranchManager
                      ? "Receiving branch is locked to your assigned active branch."
                      : "Add one or more products with available source-branch stock."}
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
                  Available qty shown
                </span>
              </div>
            </div>

            <div className="card-body py-2 px-3">
              <div
                className="text-muted mb-2"
                style={{
                  fontSize: 12.5,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={`Request From: ${getBranchLabel(fromBranchId)} → Request To: ${
                  isBranchManager ? assignedBranchName : getBranchLabel(toBranchId)
                }`}
              >
                <strong>Request From:</strong> {getBranchLabel(fromBranchId)}{" "}
                <strong className="mx-2">→</strong>
                <strong>Request To:</strong>{" "}
                {isBranchManager ? assignedBranchName : getBranchLabel(toBranchId)}
              </div>

              <form onSubmit={createTransfer}>
                <div className="row g-2 align-items-end">
                  <div className="col-12 col-lg-3">
                    <label className="form-label small text-muted mb-1">Request From</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: 10 }}
                      value={fromBranchId}
                      onChange={(e) => handleFromBranchChange(e.target.value)}
                      required
                      disabled={activeFromBranches.length === 0}
                    >
                      {activeFromBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code ? `${b.code} - ` : ""}
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small text-muted mb-1">Request To</label>

                    {isBranchManager ? (
                      <div
                        className="form-control form-control-sm"
                        style={{
                          borderRadius: 10,
                          background: "#F8FAFC",
                          color: "#0F172A",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={assignedBranchName}
                      >
                        {assignedBranchName}
                      </div>
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        style={{ borderRadius: 10 }}
                        value={toBranchId}
                        onChange={(e) => handleToBranchChange(e.target.value)}
                        required
                        disabled={activeToBranches.length === 0}
                      >
                        {activeToBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.code ? `${b.code} - ` : ""}
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="col-12 col-lg-3">
                    <label className="form-label small text-muted mb-1">
                      Product {inventoryLoading ? "(loading stock...)" : ""}
                    </label>
                    <select
                      className="form-select form-select-sm"
                      style={{ borderRadius: 10 }}
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      required
                      disabled={inventoryLoading || productOptions.length === 0}
                    >
                      {productOptions.length === 0 ? (
                        <option value="">No products available</option>
                      ) : (
                        productOptions.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.availableQty <= 0}>
                            {p.code ? `${p.code} - ` : ""}
                            {p.name} | Available: {p.availableQty}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="col-8 col-lg-1">
                    <label className="form-label small text-muted mb-1">Qty</label>
                    <input
                      className="form-control form-control-sm"
                      style={{ borderRadius: 10 }}
                      placeholder="Qty"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>

                  <div className="col-4 col-lg-2 d-grid">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      style={{
                        borderRadius: 10,
                        fontWeight: 800,
                        minHeight: 31,
                      }}
                      onClick={addTransferItem}
                      disabled={!canAddItem || inventoryLoading}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>
                  Selected product available in source branch:{" "}
                  <strong>{selectedProduct ? selectedProductAvailable : 0}</strong>
                </div>

                {selectedItems.length > 0 ? (
                  <div
                    className="mt-2"
                    style={{
                      border: "1px solid rgba(148,163,184,.28)",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="d-flex flex-wrap justify-content-between align-items-center gap-2"
                      style={{
                        padding: "6px 10px",
                        background: "rgba(248,250,252,.9)",
                        borderBottom: "1px solid rgba(148,163,184,.22)",
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0F172A" }}>
                        Selected Transfer Items
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        style={{
                          borderRadius: 8,
                          fontWeight: 700,
                          padding: "3px 8px",
                          fontSize: 11.5,
                        }}
                        onClick={clearTransferItems}
                      >
                        Clear
                      </button>
                    </div>

                    <div className="table-responsive">
                      <table
                        className="table table-sm table-bordered align-middle mb-0"
                        style={{ fontSize: 12.5 }}
                      >
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th style={{ width: 95, textAlign: "center" }}>Available</th>
                            <th style={{ width: 90, textAlign: "center" }}>Qty</th>
                            <th style={{ width: 90, textAlign: "center" }}>Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedItems.map((item) => (
                            <tr key={item.productId}>
                              <td style={{ fontWeight: 800 }}>{item.label}</td>
                              <td className="text-center">{getAvailableQty(item.productId)}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  style={{
                                    borderRadius: 8,
                                    padding: "3px 8px",
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                  }}
                                  onClick={() => removeTransferItem(item.productId)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
                  <div className="text-muted" style={{ fontSize: 11.5 }}>
                    Add products first, then create one transfer request containing all selected items.
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      borderRadius: 10,
                      fontWeight: 800,
                      minHeight: 31,
                      padding: "5px 14px",
                    }}
                    disabled={!canSubmitTransfer}
                  >
                    Create Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <div className="card" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                {isBranchScoped ? "Branch Transfers" : "Transfer List"}
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${transfers.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            {loading ? (
              <div className="text-muted">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-sm table-bordered table-hover align-middle mb-0"
                  style={{ fontSize: 13 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 70, textAlign: "center" }}>ID</th>
                      <th style={{ minWidth: 185 }}>Request From</th>
                      <th style={{ minWidth: 185 }}>Request To</th>
                      <th style={{ width: 115 }}>Status</th>
                      <th style={{ minWidth: 260 }}>Items</th>
                      <th style={{ width: 165, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transfers.map((t, index) => (
                      <tr key={t.id}>
                        <td
                          style={{
                            width: 70,
                            fontWeight: 900,
                            textAlign: "center",
                            color: "#0F172A",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        <td
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 220,
                          }}
                          title={`${t.fromBranch?.code ? `${t.fromBranch.code} - ` : ""}${
                            t.fromBranch?.name || "-"
                          }`}
                        >
                          {t.fromBranch?.code ? `${t.fromBranch.code} - ` : ""}
                          {t.fromBranch?.name || "-"}
                          {t.fromBranch?.isActive === false ? (
                            <span className="text-muted small ms-1">(Inactive)</span>
                          ) : null}
                        </td>

                        <td
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 220,
                          }}
                          title={`${t.toBranch?.code ? `${t.toBranch.code} - ` : ""}${
                            t.toBranch?.name || "-"
                          }`}
                        >
                          {t.toBranch?.code ? `${t.toBranch.code} - ` : ""}
                          {t.toBranch?.name || "-"}
                          {t.toBranch?.isActive === false ? (
                            <span className="text-muted small ms-1">(Inactive)</span>
                          ) : null}
                        </td>

                        <td>
                          <span style={badgeStyle(t.status)}>{t.status}</span>
                        </td>

                        <td>
                          {t.items?.length ? (
                            t.items.map((it) => (
                              <div key={it.id} style={{ lineHeight: 1.25 }}>
                                <span style={{ fontWeight: 800 }}>
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
                        <td colSpan="6" className="text-center text-muted py-3">
                          No transfers found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
              {isBranchManager
                ? "Branch Manager can request and receive transfers only for the assigned active branch."
                : isBranchStaff
                ? "Branch Staff can view branch transfers only."
                : isTransferAdmin
                ? "Admin Staff can approve, reject, dispatch, and receive transfer requests. New transfer requests require active branches."
                : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}