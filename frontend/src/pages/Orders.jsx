// frontend/src/pages/Orders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const badgeStyle = (status) => {
  const s = String(status || "").toUpperCase();

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  const map = {
    PENDING: { background: "#FFF7ED", color: "#9A3412", borderColor: "#FED7AA" },
    APPROVED: { background: "#ECFDF5", color: "#065F46", borderColor: "#A7F3D0" },
    PACKED: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    DISPATCHED: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    DELIVERED: { background: "#ECFEFF", color: "#0E7490", borderColor: "#A5F3FC" },
    CANCELLED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
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

const actionCompleteStyle = (type) => {
  const isDelivered = type === "DELIVERED";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    borderRadius: "50%",
    fontSize: 15,
    fontWeight: 900,
    border: isDelivered ? "1px solid #A7F3D0" : "1px solid #FECACA",
    background: isDelivered ? "#ECFDF5" : "#FEF2F2",
    color: isDelivered ? "#047857" : "#B91C1C",
  };
};

const money = (value) => `৳${Number(value || 0).toLocaleString()}`;

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

export default function Orders() {
  const navigate = useNavigate();

  const [distributors, setDistributors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [distributorId, setDistributorId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [orderItems, setOrderItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [error, setError] = useState("");

  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";
  const fullName = sessionStorage.getItem("fullName") || "System User";

  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInventoryOfficer = role === "INVENTORY_OFFICER";
  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchStaff = role === "BRANCH_STAFF";

  const isBranchScoped = isBranchManager || isBranchStaff;
  const canManageWorkflow = isSuperAdmin || isInventoryOfficer || isBranchManager;

  const activeBranches = useMemo(
    () => branches.filter((b) => b.isActive !== false),
    [branches]
  );

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) || null,
    [branches, branchId]
  );

  const selectedBranchIsActive = selectedBranch ? selectedBranch.isActive !== false : true;

  const selectedStock = useMemo(
    () => stockItems.find((it) => it.productId === selectedProductId),
    [stockItems, selectedProductId]
  );

  const selectedProductAlreadyInOrderQty = useMemo(() => {
    return orderItems
      .filter((item) => item.productId === selectedProductId)
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [orderItems, selectedProductId]);

  const selectedAvailableQty = Number(selectedStock?.quantity ?? 0);
  const selectedRemainingQty = Math.max(
    selectedAvailableQty - selectedProductAlreadyInOrderQty,
    0
  );
  const selectedUnitPrice = Number(selectedStock?.product?.price ?? 0);

  const qtyNum = useMemo(() => {
    const n = Number(itemQuantity);
    return Number.isInteger(n) ? n : NaN;
  }, [itemQuantity]);

  const itemQtyValid =
    Number.isInteger(qtyNum) && qtyNum > 0 && qtyNum <= selectedRemainingQty;

  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  }, [orderItems]);

  const canAddItem =
    selectedProductId &&
    selectedStock &&
    selectedRemainingQty > 0 &&
    selectedUnitPrice > 0 &&
    itemQtyValid &&
    !loadingStock;

  const canCreate =
    distributorId &&
    branchId &&
    selectedBranchIsActive &&
    orderItems.length > 0 &&
    !loadingStock;

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

  const resetOrderItems = () => {
    setOrderItems([]);
    setSelectedProductId("");
    setItemQuantity("");
  };

  const fetchStockForBranch = async (bId) => {
    if (!bId) {
      setStockItems([]);
      setSelectedProductId("");
      return;
    }

    const branch = branches.find((b) => b.id === bId);
    if (branch && branch.isActive === false) {
      setStockItems([]);
      setSelectedProductId("");
      setError("This branch is inactive. Please activate the branch before creating orders.");
      return;
    }

    setLoadingStock(true);

    try {
      const res = await client.get(`/inventory?branchId=${bId}`);
      const data = res.data?.data || [];

      data.sort((a, b) => (a.product?.name || "").localeCompare(b.product?.name || ""));
      setStockItems(data);

      const firstAvailable = data.find((it) => Number(it.quantity || 0) > 0);
      setSelectedProductId(firstAvailable ? firstAvailable.productId : "");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branch stock";
      setError(msg);
      handleUnauthorized(msg);
      setStockItems([]);
      setSelectedProductId("");
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchAll = async () => {
    setError("");
    setLoading(true);

    try {
      if (isBranchScoped && !assignedBranchId) {
        setError("No branch is assigned to this account. Please contact the administrator.");
        setOrders([]);
        setStockItems([]);
        setLoading(false);
        return;
      }

      const orderUrl = "/orders";

      if (isBranchScoped) {
        const [dRes, oRes] = await Promise.all([
          client.get("/distributors"),
          client.get(orderUrl),
        ]);

        const d = dRes.data?.data || [];
        const o = oRes.data?.data || [];

        setDistributors(d);
        setBranches([]);
        setOrders(o);

        if (!distributorId && d[0]?.id) {
          setDistributorId(d[0].id);
        }

        setBranchId(assignedBranchId);
        await fetchStockForBranch(assignedBranchId);
      } else {
        const [dRes, bRes, oRes] = await Promise.all([
          client.get("/distributors"),
          client.get("/branches"),
          client.get(orderUrl),
        ]);

        const d = dRes.data?.data || [];
        const b = bRes.data?.data || [];
        const active = b.filter((branch) => branch.isActive !== false);
        const o = oRes.data?.data || [];

        setDistributors(d);
        setBranches(active);
        setOrders(o);

        const currentBranchStillActive = active.some((branch) => branch.id === branchId);
        const nextDistributorId = distributorId || (d[0]?.id ?? "");
        const nextBranchId =
          currentBranchStillActive && branchId ? branchId : active[0]?.id || "";

        if (!distributorId && nextDistributorId) setDistributorId(nextDistributorId);
        setBranchId(nextBranchId);

        if (nextBranchId) {
          await fetchStockForBranch(nextBranchId);
        } else {
          setStockItems([]);
          setSelectedProductId("");
          setError("No active branches available for creating orders.");
        }
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load orders";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBranchScoped && assignedBranchId) {
      setBranchId(assignedBranchId);
    }

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!branchId) return;

    fetchStockForBranch(branchId);
    setItemQuantity("");
    setOrderItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const assignedBranchName = useMemo(() => {
    if (!isBranchScoped) return "";

    const fromOrders = orders.find(
      (o) => o.branch?.id === assignedBranchId || o.branchId === assignedBranchId
    );

    if (fromOrders?.branch?.name) return fromOrders.branch.name;

    const fromStock = stockItems.find(
      (it) => it.branch?.id === assignedBranchId || it.branchId === assignedBranchId
    );

    if (fromStock?.branch?.name) return fromStock.branch.name;

    return sessionStorage.getItem("branchName") || "Assigned Branch";
  }, [assignedBranchId, isBranchScoped, orders, stockItems]);

  const addItemToOrder = () => {
    setError("");

    if (!selectedStock || !selectedProductId) {
      setError("Please select a product.");
      return;
    }

    if (!itemQtyValid) {
      setError(`Quantity must be between 1 and ${selectedRemainingQty}.`);
      return;
    }

    const product = selectedStock.product || {};
    const unitPrice = Number(product.price || 0);
    const quantity = qtyNum;
    const subtotal = Number((quantity * unitPrice).toFixed(2));

    const newItem = {
      productId: selectedProductId,
      productCode: product.code || "",
      productName: product.name || "Product",
      unit: product.unit || "-",
      quantity,
      unitPrice,
      subtotal,
      availableQty: selectedAvailableQty,
    };

    setOrderItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === selectedProductId);

      if (existingIndex === -1) {
        return [...prev, newItem];
      }

      return prev.map((item, index) => {
        if (index !== existingIndex) return item;

        const updatedQuantity = item.quantity + quantity;

        return {
          ...item,
          quantity: updatedQuantity,
          subtotal: Number((updatedQuantity * unitPrice).toFixed(2)),
          availableQty: selectedAvailableQty,
        };
      });
    });

    setItemQuantity("");
  };

  const removeItemFromOrder = (productId) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearOrderItems = () => {
    setOrderItems([]);
    setItemQuantity("");
  };

  const createOrder = async (e) => {
    e.preventDefault();
    setError("");

    const finalBranchId = isBranchScoped ? assignedBranchId : branchId;

    if (!distributorId || !finalBranchId) {
      setError("Please select distributor and branch.");
      return;
    }

    const branch = branches.find((b) => b.id === finalBranchId);
    if (branch && branch.isActive === false) {
      setError("This branch is inactive. Please activate the branch before creating orders.");
      return;
    }

    if (orderItems.length === 0) {
      setError("Please add at least one product to the order.");
      return;
    }

    try {
      await client.post("/orders", {
        distributorId,
        branchId: finalBranchId,
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      clearOrderItems();
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create order");
    }
  };

  const updateStatus = async (id, status) => {
    setError("");

    try {
      await client.patch(`/orders/${id}/status`, { status });
      await fetchAll();

      if (invoiceOrder?.id === id && status === "CANCELLED") {
        setInvoiceOrder(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status");
    }
  };

  const openInvoice = (order) => {
    if (order.status === "CANCELLED") return;
    setInvoiceOrder(order);
    setTimeout(() => {
      document.getElementById("invoice-section")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  };

  const closeInvoice = () => {
    setInvoiceOrder(null);
  };

  const printInvoice = () => {
    window.print();
  };

  const renderStatusButtons = (o) => {
    if (o.status === "DELIVERED") {
      return (
        <span style={actionCompleteStyle("DELIVERED")} title="Delivered">
          <i className="bi bi-check-lg"></i>
        </span>
      );
    }

    if (o.status === "CANCELLED") {
      return (
        <span style={actionCompleteStyle("CANCELLED")} title="Cancelled">
          <i className="bi bi-x-lg"></i>
        </span>
      );
    }

    if (isBranchStaff) {
      if (o.status === "PENDING") {
        return (
          <button
            className="btn btn-sm btn-outline-danger"
            style={{ borderRadius: 8, fontWeight: 700, padding: "4px 9px", fontSize: 12 }}
            onClick={() => updateStatus(o.id, "CANCELLED")}
          >
            Cancel
          </button>
        );
      }

      return <span className="text-muted">—</span>;
    }

    if (!canManageWorkflow) {
      return <span className="text-muted">—</span>;
    }

    if (o.status === "PENDING") {
      return (
        <div className="d-flex gap-1 flex-wrap justify-content-center">
          <button
            className="btn btn-sm btn-outline-success"
            style={{ borderRadius: 8, fontWeight: 700, padding: "4px 9px", fontSize: 12 }}
            onClick={() => updateStatus(o.id, "APPROVED")}
          >
            Approve
          </button>

          <button
            className="btn btn-sm btn-outline-danger"
            style={{ borderRadius: 8, fontWeight: 700, padding: "4px 9px", fontSize: 12 }}
            onClick={() => updateStatus(o.id, "CANCELLED")}
          >
            Cancel
          </button>
        </div>
      );
    }

    if (o.status === "APPROVED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 8, fontWeight: 700, padding: "4px 9px", fontSize: 12 }}
          onClick={() => updateStatus(o.id, "PACKED")}
        >
          Packed
        </button>
      );
    }

    if (o.status === "PACKED") {
      return (
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ borderRadius: 8, fontWeight: 700, padding: "4px 9px", fontSize: 12 }}
          onClick={() => updateStatus(o.id, "DISPATCHED")}
        >
          Dispatch
        </button>
      );
    }

    if (o.status === "DISPATCHED") {
      return (
        <button
          className="btn btn-sm btn-outline-secondary"
          style={{ borderRadius: 8, fontWeight: 700, padding: "4px 9px", fontSize: 12 }}
          onClick={() => updateStatus(o.id, "DELIVERED")}
        >
          Delivered
        </button>
      );
    }

    return <span className="text-muted">—</span>;
  };

  const pageWrapStyle = { marginTop: 18, paddingBottom: 26 };

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

  const hintPillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(147,197,253,.6)",
    background: "rgba(239,246,255,.85)",
    color: "#1D4ED8",
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: "nowrap",
  };

  const compactSelectStyle = {
    borderRadius: 12,
    fontSize: 14,
    minHeight: 42,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  return (
    <>
      <style>
        {`
          @media print {
            .si-sidebar,
            .si-topbar,
            .no-print,
            .orders-page-content {
              display: none !important;
            }

            body.si-layout {
              padding-left: 0 !important;
              padding-top: 0 !important;
              background: #ffffff !important;
            }

            .invoice-print-area {
              margin: 0 !important;
              padding: 0 !important;
            }

            .invoice-print-card {
              box-shadow: none !important;
              border: 1px solid #d1d5db !important;
              break-inside: avoid;
              width: 100% !important;
            }

            .invoice-print-card .table {
              font-size: 11px !important;
            }

            @page {
              margin: 18mm 12mm;
            }
          }
        `}
      </style>

      <NavBar />

      <div className="container-fluid px-4 orders-page-content" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Orders
            </h2>
            <div className="text-muted" style={{ marginTop: 4 }}>
              {isBranchScoped
                ? "Manage orders for your assigned branch only."
                : "Create multi-item distributor orders using active branch stock."}
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
            title="Refresh full order list"
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

        <div className="card mb-4" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
                  Create Order
                </div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {isBranchScoped
                    ? "Branch is locked to your assigned branch. Add multiple products before creating the order."
                    : "Only active branches are available. Add multiple products before creating the order."}
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
                Multi-item order enabled
              </span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={createOrder}>
              <div className="row g-2 align-items-end">
                <div className="col-12 col-lg-2">
                  <label className="form-label small text-muted mb-1">Distributor</label>
                  <select
                    className="form-select"
                    style={compactSelectStyle}
                    value={distributorId}
                    onChange={(e) => setDistributorId(e.target.value)}
                    required
                    title={
                      distributors.find((d) => d.id === distributorId)?.name ||
                      "Select distributor"
                    }
                  >
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code ? `${d.code} - ` : ""}
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-lg-2">
                  <label className="form-label small text-muted mb-1">Branch</label>

                  {isBranchScoped ? (
                    <div
                      className="form-control"
                      style={{
                        ...compactSelectStyle,
                        background: "#F8FAFC",
                        color: "#0F172A",
                        fontWeight: 700,
                      }}
                      title={assignedBranchName}
                    >
                      {assignedBranchName}
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      style={compactSelectStyle}
                      value={branchId}
                      onChange={(e) => {
                        setBranchId(e.target.value);
                        resetOrderItems();
                      }}
                      required
                      disabled={activeBranches.length === 0}
                      title={branches.find((b) => b.id === branchId)?.name || "Select branch"}
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

                <div className="col-12 col-lg-5">
                  <label className="form-label small text-muted mb-1">
                    Product from branch stock
                  </label>
                  <select
                    className="form-select"
                    style={{
                      ...compactSelectStyle,
                      fontSize: 13,
                    }}
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setItemQuantity("");
                    }}
                    disabled={loadingStock || !branchId}
                    title={selectedStock?.product?.name || "Select product"}
                  >
                    {stockItems.length === 0 ? (
                      <option value="">No products available</option>
                    ) : (
                      stockItems.map((it) => {
                        const alreadyAddedQty = orderItems
                          .filter((item) => item.productId === it.productId)
                          .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

                        const remaining = Math.max(Number(it.quantity || 0) - alreadyAddedQty, 0);

                        return (
                          <option
                            key={it.productId}
                            value={it.productId}
                            disabled={remaining <= 0}
                          >
                            {it.product?.code ? `${it.product.code} - ` : ""}
                            {it.product?.name}
                            {typeof it.product?.price === "number" ? ` (৳${it.product.price})` : ""}
                            {` | Avl: ${remaining}`}
                          </option>
                        );
                      })
                    )}
                  </select>

                  <div className="form-text">
                    {loadingStock
                      ? "Loading branch stock..."
                      : stockItems.length === 0
                      ? "No products stocked in this active branch yet."
                      : null}
                  </div>
                </div>

                <div className="col-8 col-lg-1">
                  <label className="form-label small text-muted mb-1">Qty</label>
                  <input
                    className={`form-control ${itemQuantity && !itemQtyValid ? "is-invalid" : ""}`}
                    style={{
                      borderRadius: 12,
                      fontSize: 14,
                      minHeight: 42,
                    }}
                    placeholder="Qty"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    disabled={!selectedProductId || selectedRemainingQty <= 0 || loadingStock}
                  />

                  {itemQuantity && !itemQtyValid ? (
                    <div className="invalid-feedback">Max {selectedRemainingQty}</div>
                  ) : null}
                </div>

                <div className="col-4 col-lg-2 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    style={{
                      borderRadius: 12,
                      fontWeight: 800,
                      padding: "10px 12px",
                      whiteSpace: "nowrap",
                      minHeight: 42,
                    }}
                    disabled={!canAddItem}
                    onClick={addItemToOrder}
                  >
                    Add
                  </button>
                </div>

                <div className="col-12">
                  <div className="d-flex flex-wrap gap-2" style={{ marginTop: 6, fontSize: 13 }}>
                    <span
                      style={{
                        ...hintPillStyle,
                        background: "rgba(236,254,255,.75)",
                        borderColor: "rgba(165,243,252,.85)",
                        color: "#0E7490",
                      }}
                    >
                      Remaining:{" "}
                      <span style={{ color: "#0F172A" }}>
                        {selectedProductId ? selectedRemainingQty : "-"}
                      </span>
                    </span>

                    <span
                      style={{
                        ...hintPillStyle,
                        background: "rgba(245,243,255,.75)",
                        borderColor: "rgba(221,214,254,.9)",
                        color: "#5B21B6",
                      }}
                    >
                      Unit:{" "}
                      <span style={{ color: "#0F172A" }}>
                        {selectedUnitPrice ? money(selectedUnitPrice) : "-"}
                      </span>
                    </span>

                    <span
                      style={{
                        ...hintPillStyle,
                        background: "rgba(236,253,245,.75)",
                        borderColor: "rgba(167,243,208,.9)",
                        color: "#065F46",
                      }}
                    >
                      Order Total:{" "}
                      <span style={{ color: "#0F172A" }}>{money(orderTotal)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="mt-3"
                style={{
                  border: "1px solid rgba(148,163,184,.35)",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#FFFFFF",
                }}
              >
                <div
                  className="d-flex flex-wrap justify-content-between align-items-center gap-2"
                  style={{
                    padding: "10px 12px",
                    background:
                      "linear-gradient(180deg, rgba(239,246,255,.65), rgba(255,255,255,1))",
                    borderBottom: "1px solid rgba(148,163,184,.25)",
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#0F172A", fontSize: 14 }}>
                    Selected Order Items
                  </div>

                  <div className="d-flex gap-2 align-items-center">
                    <span
                      className="text-muted"
                      style={{
                        fontSize: 12,
                        padding: "5px 9px",
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,.35)",
                      }}
                    >
                      {orderItems.length} item(s)
                    </span>

                    {orderItems.length > 0 ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        style={{ borderRadius: 10, fontWeight: 800 }}
                        onClick={clearOrderItems}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: 230 }}>Product</th>
                        <th style={{ width: 90, textAlign: "center" }}>Qty</th>
                        <th style={{ width: 120, textAlign: "right" }}>Unit Price</th>
                        <th style={{ width: 130, textAlign: "right" }}>Subtotal</th>
                        <th style={{ width: 95, textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.productId}>
                          <td>
                            <div style={{ fontWeight: 800, color: "#0F172A" }}>
                              {item.productCode ? `${item.productCode} - ` : ""}
                              {item.productName}
                            </div>
                            <div className="text-muted small">Unit: {item.unit || "-"}</div>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 800 }}>
                            {item.quantity}
                          </td>
                          <td style={{ textAlign: "right" }}>{money(item.unitPrice)}</td>
                          <td style={{ textAlign: "right", fontWeight: 900 }}>
                            {money(item.subtotal)}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: 8, fontWeight: 800 }}
                              onClick={() => removeItemFromOrder(item.productId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}

                      {orderItems.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-3">
                            No products added yet. Select a product and click Add.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ textAlign: "right", fontWeight: 900 }}>
                          Grand Total
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 900 }}>
                          {money(orderTotal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="p-3 d-flex justify-content-end">
                  <button
                    className="btn btn-primary"
                    style={{
                      borderRadius: 12,
                      fontWeight: 900,
                      padding: "10px 18px",
                    }}
                    disabled={!canCreate}
                  >
                    Create Order
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={panelStyle}>
          <div className="card-body" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
                {isBranchScoped ? "Branch Orders" : "Order List"}
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                {loading ? "Loading..." : `${orders.length} record(s)`}
              </div>
            </div>
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-muted">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-sm table-bordered table-hover align-middle"
                  style={{ fontSize: 14 }}
                >
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 75 }}>Code</th>
                      <th style={{ minWidth: 150 }}>Distributor</th>
                      <th style={{ minWidth: 125 }}>Branch</th>
                      <th style={{ width: 105 }}>Status</th>
                      <th style={{ width: 90 }}>Total</th>
                      <th style={{ minWidth: 240 }}>Items</th>
                      <th style={{ width: 215, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 800 }}>{o.code || "-"}</td>
                        <td>{o.distributor?.name || "-"}</td>
                        <td>
                          {o.branch?.name || "-"}
                          {o.branch?.isActive === false ? (
                            <span className="text-muted small ms-1">(Inactive)</span>
                          ) : null}
                        </td>
                        <td>
                          <span style={badgeStyle(o.status)}>{o.status}</span>
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          {typeof o.totalAmount === "number"
                            ? money(o.totalAmount)
                            : o.totalAmount}
                        </td>
                        <td>
                          {o.items?.length ? (
                            o.items.map((it) => (
                              <div key={it.id} style={{ lineHeight: 1.25 }}>
                                <span style={{ fontWeight: 700 }}>{it.product?.name}</span>{" "}
                                <span className="text-muted">x {it.quantity}</span>{" "}
                                <span className="text-muted">(@{it.unitPrice})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="d-flex flex-wrap gap-1 justify-content-center align-items-center">
                            {o.status !== "CANCELLED" ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                style={{
                                  borderRadius: 8,
                                  fontWeight: 800,
                                  padding: "4px 9px",
                                  fontSize: 12,
                                }}
                                onClick={() => openInvoice(o)}
                                title="Generate invoice"
                              >
                                <i className="bi bi-receipt me-1"></i>
                                Invoice
                              </button>
                            ) : null}

                            {renderStatusButtons(o)}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No orders found
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 12, marginTop: 10 }}>
              New orders can be created only for active branches. Cancelled orders do not generate invoices.
            </div>
          </div>
        </div>
      </div>

      {invoiceOrder ? (
        <div
          id="invoice-section"
          className="container-fluid px-4 invoice-print-area"
          style={{ marginTop: 18, paddingBottom: 26 }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3 no-print">
            <div>
              <h2 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
                Invoice
              </h2>
              <div className="text-muted" style={{ marginTop: 4 }}>
                Generated invoice for order {invoiceOrder.code || "-"}.
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                style={{ borderRadius: 10, fontWeight: 700, padding: "8px 14px" }}
                onClick={closeInvoice}
              >
                Close Invoice
              </button>

              <button
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 10, fontWeight: 800, padding: "8px 14px" }}
                onClick={printInvoice}
              >
                <i className="bi bi-printer me-1"></i>
                Print / Save PDF
              </button>
            </div>
          </div>

          <InvoiceCard order={invoiceOrder} preparedBy={fullName} />
        </div>
      ) : null}
    </>
  );
}

function InvoiceCard({ order, preparedBy }) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const total = Number(order?.totalAmount || 0);
  const distributor = order?.distributor || {};
  const branch = order?.branch || {};
  const generatedAt = new Date().toLocaleString();

  const invoiceNo = `INV-${order?.code || order?.id || "-"}`;

  return (
    <div
      className="card invoice-print-card"
      style={{
        borderRadius: 18,
        border: "1px solid rgba(148,163,184,.35)",
        boxShadow: "0 10px 26px rgba(15,23,42,.06)",
        overflow: "hidden",
      }}
    >
      <div className="report-brand-print">
        <div
          style={{
            textAlign: "center",
            padding: "16px 20px 12px",
            borderBottom: "1px solid rgba(148,163,184,.35)",
            background: "#FFFFFF",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: "#0F172A",
              textTransform: "uppercase",
            }}
          >
            SMART INVENTORY SYSTEM
          </h1>
        </div>

        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(148,163,184,.35)",
            background:
              "linear-gradient(180deg, rgba(219,234,254,.45), rgba(255,255,255,1))",
          }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h2
                className="m-0"
                style={{
                  fontWeight: 900,
                  color: "#0F172A",
                  fontSize: 26,
                }}
              >
                Order Invoice
              </h2>

              <div className="text-muted" style={{ fontSize: 14, marginTop: 6 }}>
                <strong>Generated:</strong> {generatedAt}
              </div>
            </div>

            <div className="text-end" style={{ fontSize: 14, lineHeight: 1.7 }}>
              <div>
                <strong>Invoice No:</strong> {invoiceNo}
              </div>
              <div>
                <strong>Order Code:</strong> {order?.code || "-"}
              </div>
              <div>
                <strong>Order Date:</strong> {formatDateTime(order?.createdAt)}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span style={badgeStyle(order?.status)}>{order?.status || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="row g-3 mb-4">
          <InfoCard
            title="Distributor Information"
            rows={[
              ["Name", distributor.name || "-"],
              ["Email", distributor.email || "-"],
              ["Phone", distributor.phone || "-"],
              ["Address", distributor.address || "-"],
            ]}
          />

          <InfoCard
            title="Branch Information"
            rows={[
              [
                "Branch",
                `${branch.code ? `${branch.code} - ` : ""}${branch.name || "-"}`,
              ],
              ["Address", branch.address || "-"],
              ["Prepared By", preparedBy || "-"],
              ["Prepared At", generatedAt],
            ]}
          />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A" }}>
            Product Details
          </div>

          <div className="text-muted" style={{ fontSize: 13 }}>
            {items.length} item(s)
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-bordered table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60, textAlign: "center" }}>SL</th>
                <th>Product</th>
                <th style={{ width: 95, textAlign: "center" }}>Qty</th>
                <th style={{ width: 130, textAlign: "right" }}>Unit Price</th>
                <th style={{ width: 140, textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {items.map((it, index) => {
                const qty = Number(it.quantity || 0);
                const unit = Number(it.unitPrice || 0);
                const subtotal = Number(it.subtotal || qty * unit || 0);

                return (
                  <tr key={it.id || `${it.productId}-${index}`}>
                    <td style={{ textAlign: "center", fontWeight: 800 }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: "#0F172A" }}>
                        {it.product?.code ? `${it.product.code} - ` : ""}
                        {it.product?.name || "Product"}
                      </div>
                      <div className="text-muted small">Unit: {it.product?.unit || "-"}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>{qty}</td>
                    <td style={{ textAlign: "right" }}>{money(unit)}</td>
                    <td style={{ textAlign: "right", fontWeight: 800 }}>{money(subtotal)}</td>
                  </tr>
                );
              })}

              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No items found.
                  </td>
                </tr>
              ) : null}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: "right", fontWeight: 900 }}>
                  Grand Total
                </td>
                <td style={{ textAlign: "right", fontWeight: 900, fontSize: 16 }}>
                  {money(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div
          className="d-flex justify-content-between align-items-end gap-3"
          style={{
            marginTop: 34,
            fontSize: 12,
            color: "#475569",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: "#0F172A" }}>Note</div>
            <div>This is a system-generated invoice.</div>
            <div>Goods should be verified with the order record.</div>
          </div>

          <div style={{ textAlign: "center", minWidth: 170 }}>
            <div
              style={{
                borderTop: "1px solid #0F172A",
                paddingTop: 6,
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, rows }) {
  return (
    <div className="col-12 col-md-6">
      <div
        className="p-3 h-100"
        style={{
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,.28)",
          boxShadow: "0 8px 18px rgba(15,23,42,.05)",
          background: "rgba(255,255,255,.88)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 900, color: "#0F172A", marginBottom: 10 }}>
          {title}
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          {rows.map(([label, value]) => (
            <div key={label}>
              <strong>{label}:</strong> {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}