// frontend/src/pages/Reports.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import NavBar from "../components/NavBar";

const reportTabs = [
  { key: "lowStock", label: "Low Stock", endpoint: "/reports/low-stock" },
  { key: "stockTx", label: "Stock Transactions", endpoint: "/reports/stock-transactions" },
  { key: "orders", label: "Orders", endpoint: "/reports/orders" },
  { key: "transfers", label: "Transfers", endpoint: "/reports/transfers" },
];

const orderStatuses = ["PENDING", "APPROVED", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED"];
const transferStatuses = ["PENDING", "APPROVED", "REJECTED", "DISPATCHED", "RECEIVED"];

const money = (n) => `৳${Number(n || 0).toLocaleString()}`;

const fmtDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const displayUserName = (user) => {
  if (user?.role === "SUPER_ADMIN") return "Mily";
  return user?.fullName || "-";
};

const statusBadgeStyle = (status) => {
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
    PACKED: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    DISPATCHED: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    DELIVERED: { background: "#ECFEFF", color: "#0E7490", borderColor: "#A5F3FC" },
    CANCELLED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    REJECTED: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    RECEIVED: { background: "#ECFDF5", color: "#047857", borderColor: "#A7F3D0" },
    STOCK_IN: { background: "#ECFDF5", color: "#047857", borderColor: "#A7F3D0" },
    STOCK_OUT: { background: "#FEF2F2", color: "#B91C1C", borderColor: "#FECACA" },
    ADJUSTMENT: { background: "#F5F3FF", color: "#5B21B6", borderColor: "#DDD6FE" },
    TRANSFER_IN: { background: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" },
    TRANSFER_OUT: { background: "#FFF7ED", color: "#C2410C", borderColor: "#FED7AA" },
    ORDER_OUT: { background: "#F3F4F6", color: "#374151", borderColor: "#E5E7EB" },
    LOW_STOCK: { background: "#FFF7ED", color: "#C2410C", borderColor: "#FED7AA" },
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

export default function Reports() {
  const navigate = useNavigate();

  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);

  const [tab, setTab] = useState("lowStock");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [data, setData] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(true);
  const [error, setError] = useState("");

  const role = sessionStorage.getItem("role") || "";
  const assignedBranchId = sessionStorage.getItem("branchId") || "";

  const isBranchManager = role === "BRANCH_MANAGER";
  const isBranchScoped = isBranchManager;

  const activeTab = reportTabs.find((x) => x.key === tab) || reportTabs[0];

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) || null,
    [branches, branchId]
  );

  const reportTitle = `${activeTab.label} Report`;
  const generatedAt = useMemo(() => new Date().toLocaleString(), [data]);

  const statusOptions =
    tab === "orders" ? orderStatuses : tab === "transfers" ? transferStatuses : [];

  const dateFilterEnabled = tab !== "lowStock";
  const statusFilterEnabled = tab === "orders" || tab === "transfers";

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

  const fetchBranches = async () => {
    setBranchLoading(true);

    try {
      const res = await client.get("/branches");
      const b = res.data?.data || [];
      setBranches(b);

      if (isBranchScoped) {
        if (!assignedBranchId) {
          setError("No branch is assigned to this account. Please contact the administrator.");
          return;
        }

        setBranchId(assignedBranchId);
      } else if (!branchId && b.length > 0) {
        setBranchId("");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load branches";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setBranchLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setData([]);
    setHasRun(false);

    if (tab !== "orders" && tab !== "transfers") {
      setStatus("");
    }

    if (tab === "lowStock") {
      setFrom("");
      setTo("");
    }
  }, [tab]);

  const openDatePicker = (ref) => {
    const input = ref.current;
    if (!input || input.disabled) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const buildQuery = () => {
    const q = new URLSearchParams();

    if (branchId) q.set("branchId", branchId);
    if (statusFilterEnabled && status) q.set("status", status);
    if (dateFilterEnabled && from) q.set("from", from);
    if (dateFilterEnabled && to) q.set("to", to);

    return q.toString();
  };

  const runReport = async () => {
    setError("");
    setLoading(true);
    setData([]);

    try {
      const query = buildQuery();
      const url = `${activeTab.endpoint}${query ? `?${query}` : ""}`;

      const res = await client.get(url);

      setData(res.data?.data || []);
      setHasRun(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load report";
      setError(msg);
      handleUnauthorized(msg);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (tab === "lowStock") {
      const outOfStock = data.filter((x) => Number(x.quantity || 0) <= 0).length;
      const totalQty = data.reduce((sum, x) => sum + Number(x.quantity || 0), 0);

      return [
        {
          title: "Low Stock Items",
          value: data.length,
          icon: "bi-exclamation-triangle",
          hint: "Items below reorder level",
        },
        {
          title: "Out of Stock",
          value: outOfStock,
          icon: "bi-x-circle",
          hint: "Items with zero quantity",
        },
        {
          title: "Total Current Qty",
          value: totalQty,
          icon: "bi-box-seam",
          hint: "Quantity in low-stock rows",
        },
      ];
    }

    if (tab === "stockTx") {
      const totalQty = data.reduce((sum, x) => sum + Number(x.quantity || 0), 0);
      const types = new Set(data.map((x) => x.type).filter(Boolean)).size;

      return [
        {
          title: "Transactions",
          value: data.length,
          icon: "bi-arrow-left-right",
          hint: "Total stock movements",
        },
        {
          title: "Total Quantity",
          value: totalQty,
          icon: "bi-box-seam",
          hint: "Quantity moved",
        },
        {
          title: "Transaction Types",
          value: types,
          icon: "bi-diagram-3",
          hint: "Unique stock actions",
        },
      ];
    }

    if (tab === "orders") {
      const totalAmount = data.reduce((sum, x) => sum + Number(x.totalAmount || 0), 0);
      const delivered = data.filter((x) => x.status === "DELIVERED").length;

      return [
        { title: "Orders", value: data.length, icon: "bi-receipt", hint: "Total order records" },
        {
          title: "Delivered",
          value: delivered,
          icon: "bi-check-circle",
          hint: "Completed orders",
        },
        {
          title: "Total Amount",
          value: money(totalAmount),
          icon: "bi-cash-stack",
          hint: "Order value",
        },
      ];
    }

    const received = data.filter((x) => x.status === "RECEIVED").length;
    const pending = data.filter((x) => x.status === "PENDING").length;

    return [
      { title: "Transfers", value: data.length, icon: "bi-truck", hint: "Total transfer records" },
      {
        title: "Pending",
        value: pending,
        icon: "bi-hourglass-split",
        hint: "Waiting approval",
      },
      {
        title: "Received",
        value: received,
        icon: "bi-check-circle",
        hint: "Completed transfers",
      },
    ];
  }, [data, tab]);

  const tableRows = useMemo(() => {
    if (tab === "lowStock") {
      return data.map((x) => ({
        Branch: `${x.branch?.code ? `${x.branch.code} - ` : ""}${x.branch?.name || "-"}`,
        "Product Code": x.product?.code || "-",
        Product: x.product?.name || "-",
        Category: x.product?.category?.name || "-",
        Quantity: Number(x.quantity || 0),
        "Reorder Level": Number(x.reorderLevel || 0),
        Status: "LOW_STOCK",
      }));
    }

    if (tab === "stockTx") {
      return data.map((x) => ({
        Date: fmtDate(x.createdAt),
        Branch: `${x.branch?.code ? `${x.branch.code} - ` : ""}${x.branch?.name || "-"}`,
        "Product Code": x.product?.code || "-",
        Product: x.product?.name || "-",
        Type: x.type || "-",
        Quantity: Number(x.quantity || 0),
        Reason: x.reason || "-",
        "Created By": displayUserName(x.user),
      }));
    }

    if (tab === "orders") {
      return data.map((x) => ({
        Code: x.code || "-",
        Distributor: x.distributor?.name || "-",
        Branch: `${x.branch?.code ? `${x.branch.code} - ` : ""}${x.branch?.name || "-"}`,
        Status: x.status || "-",
        Total: Number(x.totalAmount || 0),
        Items:
          x.items?.map((it) => `${it.product?.name || "Product"} x ${it.quantity}`).join(", ") ||
          "-",
        Created: fmtDate(x.createdAt),
      }));
    }

    return data.map((x) => ({
      ID: x.id || "-",
      From: `${x.fromBranch?.code ? `${x.fromBranch.code} - ` : ""}${x.fromBranch?.name || "-"}`,
      To: `${x.toBranch?.code ? `${x.toBranch.code} - ` : ""}${x.toBranch?.name || "-"}`,
      Status: x.status || "-",
      Items:
        x.items?.map((it) => `${it.product?.name || "Product"} x ${it.quantity}`).join(", ") ||
        "-",
      RequestedBy: displayUserName(x.requester),
      ApprovedBy: displayUserName(x.approver),
      Created: fmtDate(x.createdAt),
    }));
  }, [data, tab]);

  const tableHeaders = useMemo(() => {
    if (tableRows.length === 0) {
      if (tab === "lowStock") {
        return [
          "Branch",
          "Product Code",
          "Product",
          "Category",
          "Quantity",
          "Reorder Level",
          "Status",
        ];
      }

      if (tab === "stockTx") {
        return [
          "Date",
          "Branch",
          "Product Code",
          "Product",
          "Type",
          "Quantity",
          "Reason",
          "Created By",
        ];
      }

      if (tab === "orders") {
        return ["Code", "Distributor", "Branch", "Status", "Total", "Items", "Created"];
      }

      return ["ID", "From", "To", "Status", "Items", "RequestedBy", "ApprovedBy", "Created"];
    }

    return Object.keys(tableRows[0]);
  }, [tableRows, tab]);

  const printReport = () => {
    window.print();
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
    : "All Branches";

  const dateRangeLabel =
    tab === "lowStock" ? "Current stock level" : `${from || "Start"} to ${to || "Today"}`;

  const statusLabel = status || (statusFilterEnabled ? "All" : "Not applicable");

  return (
    <>
      <style>
        {`
          @media print {
            .si-sidebar,
            .si-topbar,
            .no-print {
              display: none !important;
            }

            body.si-layout {
              padding-left: 0 !important;
              padding-top: 0 !important;
              background: #ffffff !important;
            }

            .print-area {
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-card {
              box-shadow: none !important;
              border: 1px solid #d1d5db !important;
              break-inside: avoid;
            }

            .table {
              font-size: 11px !important;
            }

            .report-brand-print {
              page-break-inside: avoid;
            }

            @page {
              margin: 18mm 12mm;
            }
          }
        `}
      </style>

      <NavBar />

      <div className="container-fluid px-4 print-area" style={pageWrapStyle}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 no-print">
          <div>
            <h3 className="m-0" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
              Reports
            </h3>
            <div className="text-muted" style={{ marginTop: 2, fontSize: 14 }}>
              Generate operational reports and print or save them as PDF.
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: 10, fontWeight: 700, padding: "6px 12px" }}
              onClick={runReport}
              disabled={loading || branchLoading}
            >
              <i className="bi bi-play-circle me-1"></i>
              {loading ? "Running..." : "Run Report"}
            </button>

            <button
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 10, fontWeight: 800, padding: "6px 12px" }}
              onClick={printReport}
              disabled={!hasRun}
            >
              <i className="bi bi-printer me-1"></i>
              Print / Save PDF
            </button>
          </div>
        </div>

        {error ? (
          <div className="alert alert-danger py-2 mb-2 no-print" style={{ borderRadius: 12 }}>
            {error}
          </div>
        ) : null}

        <div className="card mb-3 no-print" style={panelStyle}>
          <div className="card-body py-2 px-3" style={headerCardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F172A" }}>
                  Report Controls
                </div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Select report type, branch, date range, and status filter.
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
                {isBranchScoped ? "Branch locked" : "Branch selectable"}
              </span>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            <div className="d-flex gap-2 flex-wrap mb-2">
              {reportTabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`btn btn-sm ${tab === t.key ? "btn-primary" : "btn-outline-primary"}`}
                  style={{ borderRadius: 999, fontWeight: 800, padding: "5px 11px" }}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="row g-2 align-items-end">
              <div className="col-12 col-xl-3">
                <label className="form-label small text-muted mb-1">Branch</label>

                {isBranchScoped ? (
                  <div
                    className="form-control form-control-sm"
                    style={{
                      ...inputStyle,
                      background: "#F8FAFC",
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
                    style={inputStyle}
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code ? `${b.code} - ` : ""}
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="col-6 col-xl-2">
                <label className="form-label small text-muted mb-1">From</label>
                <div className="input-group input-group-sm">
                  <input
                    ref={fromInputRef}
                    className="form-control"
                    style={inputStyle}
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    disabled={!dateFilterEnabled}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: "0 10px 10px 0" }}
                    onClick={() => openDatePicker(fromInputRef)}
                    disabled={!dateFilterEnabled}
                    title="Open calendar"
                  >
                    <i className="bi bi-calendar3"></i>
                  </button>
                </div>
              </div>

              <div className="col-6 col-xl-2">
                <label className="form-label small text-muted mb-1">To</label>
                <div className="input-group input-group-sm">
                  <input
                    ref={toInputRef}
                    className="form-control"
                    style={inputStyle}
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    disabled={!dateFilterEnabled}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: "0 10px 10px 0" }}
                    onClick={() => openDatePicker(toInputRef)}
                    disabled={!dateFilterEnabled}
                    title="Open calendar"
                  >
                    <i className="bi bi-calendar3"></i>
                  </button>
                </div>
              </div>

              <div className="col-12 col-xl-2">
                <label className="form-label small text-muted mb-1">Status</label>
                <select
                  className="form-select form-select-sm"
                  style={inputStyle}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!statusFilterEnabled}
                >
                  <option value="">{statusFilterEnabled ? "All Status" : "No status filter"}</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-xl-3 d-grid">
                <button
                  className="btn btn-success btn-sm"
                  style={{ borderRadius: 10, fontWeight: 800, minHeight: 31 }}
                  onClick={runReport}
                  disabled={loading || branchLoading}
                >
                  <i className="bi bi-play-circle me-1"></i>
                  {loading ? "Running..." : "Generate Report"}
                </button>
              </div>
            </div>

            <div className="text-muted mt-1" style={{ fontSize: 11.5 }}>
              Date filter is disabled for Low Stock. Status filter is available only for Orders and
              Transfers reports.
            </div>
          </div>
        </div>

        <div className="card print-card" style={panelStyle}>
          <div className="report-brand-print">
            <div
              style={{
                textAlign: "center",
                padding: "10px 16px 8px",
                borderBottom: "1px solid rgba(148,163,184,.32)",
                background: "#FFFFFF",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 0.7,
                  color: "#0F172A",
                  textTransform: "uppercase",
                }}
              >
                SMART INVENTORY SYSTEM
              </h1>
            </div>

            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid rgba(148,163,184,.32)",
                background:
                  "linear-gradient(180deg, rgba(219,234,254,.38), rgba(255,255,255,1))",
              }}
            >
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                <div>
                  <h2
                    className="m-0"
                    style={{
                      fontWeight: 900,
                      color: "#0F172A",
                      fontSize: 21,
                    }}
                  >
                    {reportTitle}
                  </h2>

                  <div className="text-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                    <strong>Generated:</strong> {generatedAt}
                  </div>
                </div>

                <div className="text-end" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                  <div>
                    <strong>Branch:</strong> {branchLabel}
                  </div>
                  <div>
                    <strong>Date Range:</strong> {dateRangeLabel}
                  </div>
                  <div>
                    <strong>Status:</strong> {statusLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body py-2 px-3">
            {!hasRun ? (
              <div
                className="text-center text-muted py-4"
                style={{
                  borderRadius: 14,
                  border: "1px dashed rgba(148,163,184,.5)",
                  background: "rgba(248,250,252,.7)",
                }}
              >
                Select filters and click “Generate Report”.
              </div>
            ) : (
              <>
                <div className="row g-2 mb-3">
                  {summary.map((s) => (
                    <SummaryCard
                      key={s.title}
                      title={s.title}
                      value={s.value}
                      icon={s.icon}
                      hint={s.hint}
                    />
                  ))}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0F172A" }}>
                    Detailed Records
                  </div>
                  <div className="text-muted" style={{ fontSize: 12.5 }}>
                    {loading ? "Loading..." : `${tableRows.length} record(s)`}
                  </div>
                </div>

                {loading ? (
                  <div className="text-muted">Loading report...</div>
                ) : (
                  <div className="table-responsive">
                    <table
                      className="table table-sm table-bordered table-hover align-middle mb-0"
                      style={{ fontSize: 12.5 }}
                    >
                      <thead className="table-light">
                        <tr>
                          {tableHeaders.map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {tableRows.map((row, idx) => (
                          <tr key={idx}>
                            {tableHeaders.map((h) => {
                              const value = row[h];

                              if (h === "Status" || h === "Type") {
                                return (
                                  <td key={h}>
                                    <span style={statusBadgeStyle(value)}>{value}</span>
                                  </td>
                                );
                              }

                              if (h === "Total") {
                                return <td key={h}>{money(value)}</td>;
                              }

                              return <td key={h}>{value}</td>;
                            })}
                          </tr>
                        ))}

                        {tableRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={tableHeaders.length}
                              className="text-center text-muted py-3"
                            >
                              No records found for the selected filters.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryCard({ title, value, icon, hint }) {
  return (
    <div className="col-12 col-sm-6 col-xl-4">
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

            <div
              style={{
                fontSize: typeof value === "string" ? 19 : 23,
                lineHeight: 1.05,
                fontWeight: 900,
                color: "#0F172A",
              }}
            >
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