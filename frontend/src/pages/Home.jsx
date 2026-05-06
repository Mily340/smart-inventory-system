// frontend/src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "bi-building",
      title: "Multi-Branch Management",
      text: "Manage branches, users, products, inventory, orders, and transfers from one centralized platform.",
    },
    {
      icon: "bi-box-seam",
      title: "Inventory Tracking",
      text: "Track stock-in, stock-out, adjustment, reorder level, and branch-wise product quantity.",
    },
    {
      icon: "bi-arrow-left-right",
      title: "Stock Transfer",
      text: "Create, approve, reject, dispatch, and receive product transfer requests between branches.",
    },
    {
      icon: "bi-cart-check",
      title: "Business Orders",
      text: "Create distributor orders from available branch stock and manage order workflow status.",
    },
    {
      icon: "bi-truck",
      title: "Delivery Workflow",
      text: "Track dispatched orders and delivery activities for smoother distribution operations.",
    },
    {
      icon: "bi-file-earmark-bar-graph",
      title: "Reports & Invoice",
      text: "Generate stock, order, transfer, transaction reports, and printable order invoices.",
    },
  ];

  const roles = [
    "System Administrator",
    "Inventory Officer",
    "Branch Manager",
    "Branch Staff",
    "Delivery Rider",
  ];

  const statCards = [
    { value: "5", label: "User Roles", icon: "bi-people" },
    { value: "Real-Time", label: "Stock Updates", icon: "bi-lightning-charge" },
    { value: "Multi", label: "Branch Support", icon: "bi-diagram-3" },
    { value: "PDF", label: "Reports & Invoice", icon: "bi-file-earmark-text" },
  ];

  const problems = [
    {
      icon: "bi-exclamation-triangle",
      title: "Manual Stock Tracking",
      text: "Manual records can create stock mismatch, delayed updates, and calculation errors.",
    },
    {
      icon: "bi-arrow-repeat",
      title: "Delayed Transfer Updates",
      text: "Branch transfer status becomes difficult to monitor without a structured tracking system.",
    },
    {
      icon: "bi-eye-slash",
      title: "Limited Branch Visibility",
      text: "Administrators need a clear view of stock levels across multiple branches.",
    },
    {
      icon: "bi-clipboard-data",
      title: "Report Preparation",
      text: "Preparing inventory, order, and transfer reports manually takes extra time.",
    },
  ];

  const benefits = [
    {
      icon: "bi-search",
      title: "Monitor Stock",
      text: "View branch-wise stock and identify low-stock or out-of-stock products.",
    },
    {
      icon: "bi-box-arrow-in-down",
      title: "Control Inventory",
      text: "Perform stock-in, stock-out, adjustment, and reorder-level operations.",
    },
    {
      icon: "bi-send-check",
      title: "Manage Transfers",
      text: "Track transfer requests from creation to approval, dispatch, and receiving.",
    },
    {
      icon: "bi-bag-check",
      title: "Process Orders",
      text: "Create business orders for distributors and update order status step by step.",
    },
    {
      icon: "bi-bell",
      title: "Get Alerts",
      text: "Show notifications for low stock and important transfer activities.",
    },
    {
      icon: "bi-printer",
      title: "Print Documents",
      text: "Print professional reports and invoices for official documentation.",
    },
  ];

  const workflow = [
    "User login with role-based access",
    "Product, branch, and stock setup",
    "Inventory stock-in, stock-out, and adjustment",
    "Transfer request, approval, dispatch, and receive",
    "Distributor order processing and invoice generation",
    "Delivery tracking, reports, and notifications",
  ];

  const aboutHighlights = [
    {
      icon: "bi-database-check",
      title: "Centralized Data",
      text: "Stores products, stock, orders, transfers, reports, and users in a centralized database.",
    },
    {
      icon: "bi-shield-lock",
      title: "Secure Access",
      text: "Uses authentication and role-based authorization to control user access.",
    },
    {
      icon: "bi-activity",
      title: "Operational Tracking",
      text: "Tracks stock movement, transfer progress, order status, and delivery activities.",
    },
    {
      icon: "bi-building-check",
      title: "Branch Control",
      text: "Supports branch-wise inventory monitoring and active or inactive branch handling.",
    },
  ];

  const pageStyle = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(239,246,255,1), rgba(255,255,255,1), rgba(245,243,255,.78))",
    color: "#0F172A",
  };

  const shellStyle = {
    maxWidth: 1140,
    margin: "0 auto",
    padding: "16px 16px 24px",
  };

  const navStyle = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.35)",
    background: "rgba(255,255,255,.88)",
    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
    padding: "12px 16px",
    backdropFilter: "blur(10px)",
  };

  const heroStyle = {
    borderRadius: 24,
    border: "1px solid rgba(148,163,184,.35)",
    background:
      "radial-gradient(circle at top left, rgba(191,219,254,.82), transparent 34%), radial-gradient(circle at bottom right, rgba(221,214,254,.78), transparent 36%), rgba(255,255,255,.94)",
    boxShadow: "0 16px 36px rgba(15,23,42,.08)",
    overflow: "hidden",
  };

  const cardStyle = {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,.30)",
    background: "rgba(255,255,255,.92)",
    boxShadow: "0 8px 18px rgba(15,23,42,.05)",
    height: "100%",
  };

  const iconBoxStyle = {
    width: 38,
    height: 38,
    borderRadius: 13,
    background: "rgba(219,234,254,.75)",
    border: "1px solid rgba(147,197,253,.70)",
    color: "#1D4ED8",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    flex: "0 0 auto",
  };

  const sectionBadgeStyle = {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#EEF2FF",
    color: "#4F46E5",
    border: "1px solid rgba(165,180,252,.75)",
    fontSize: 12,
    fontWeight: 850,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  };

  const sectionTitleStyle = {
    fontWeight: 950,
    fontSize: 24,
    letterSpacing: -0.3,
    color: "#0F172A",
    margin: 0,
  };

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        {/* Top Navigation */}
        <div
          className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3"
          style={navStyle}
        >
          <div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 950,
                letterSpacing: 0.3,
                color: "#6D28D9",
                lineHeight: 1.1,
              }}
            >
              SMART INVENTORY
            </div>

            <div className="text-muted" style={{ fontSize: 12, marginTop: 3 }}>
              Multi-Branch Inventory & Distribution Management System
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              style={{ borderRadius: 10, fontWeight: 800, padding: "8px 12px" }}
              onClick={() => navigate("/catalog")}
            >
              <i className="bi bi-grid me-1"></i>
              Product Catalog
            </button>

            <button
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 10, fontWeight: 800, padding: "8px 12px" }}
              onClick={() => navigate("/login")}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i>
              Staff Login
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section className="mb-3" style={heroStyle}>
          <div className="row g-0 align-items-center">
            <div className="col-12 col-lg-7">
              <div className="p-4 p-lg-5">
                <div
                  className="d-inline-flex align-items-center gap-2 mb-3"
                  style={{
                    padding: "6px 11px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.80)",
                    border: "1px solid rgba(147,197,253,.65)",
                    color: "#1D4ED8",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  <i className="bi bi-stars"></i>
                  Smart Business Operations
                </div>

                <h1
                  style={{
                    fontSize: "clamp(31px, 4vw, 50px)",
                    fontWeight: 950,
                    letterSpacing: -1.1,
                    lineHeight: 1.05,
                    marginBottom: 14,
                    color: "#0F172A",
                    maxWidth: 760,
                  }}
                >
                  Modern inventory control for multi-branch business operations
                </h1>

                <p
                  className="text-muted"
                  style={{
                    fontSize: 15,
                    maxWidth: 720,
                    lineHeight: 1.7,
                    marginBottom: 18,
                  }}
                >
                  Smart Inventory System helps an organization manage products, stock,
                  transfers, distributor orders, deliveries, invoices, reports, and notifications
                  from one secure role-based platform.
                </p>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  <button
                    className="btn btn-primary"
                    style={{ borderRadius: 12, fontWeight: 850, padding: "10px 16px" }}
                    onClick={() => navigate("/catalog")}
                  >
                    <i className="bi bi-grid me-1"></i>
                    Explore Product Catalog
                  </button>
                </div>

                <div className="row g-2">
                  {statCards.map((s) => (
                    <div className="col-6 col-md-3" key={s.label}>
                      <div
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(148,163,184,.25)",
                          background: "rgba(255,255,255,.76)",
                          padding: "10px 10px",
                          height: "100%",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className={`bi ${s.icon}`} style={{ color: "#2563EB" }}></i>
                          <div style={{ fontWeight: 950, color: "#0F172A", fontSize: 13 }}>
                            {s.value}
                          </div>
                        </div>

                        <div className="text-muted" style={{ fontSize: 11, fontWeight: 700 }}>
                          {s.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div className="p-3 p-lg-4">
                <div
                  style={{
                    borderRadius: 22,
                    border: "1px solid rgba(148,163,184,.28)",
                    background: "rgba(255,255,255,.72)",
                    boxShadow: "0 14px 30px rgba(15,23,42,.07)",
                    padding: 16,
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <div style={{ fontWeight: 950, fontSize: 17 }}>System Overview</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        Live operational areas
                      </div>
                    </div>

                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        background: "#EEF2FF",
                        color: "#4F46E5",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      <i className="bi bi-window-sidebar"></i>
                    </div>
                  </div>

                  {[
                    ["Products", "Catalog, category, SKU, price, and stock details", "bi-box"],
                    ["Inventory", "Stock-in, stock-out, adjustment, and reorder level", "bi-stack"],
                    ["Transfers", "Request, approval, dispatch, and receiving flow", "bi-arrow-left-right"],
                    ["Orders", "Distributor orders, status workflow, and invoice", "bi-receipt"],
                  ].map(([title, text, icon], index) => (
                    <div
                      key={title}
                      className="d-flex align-items-start gap-3 mb-2"
                      style={{
                        padding: "10px",
                        borderRadius: 14,
                        background: index % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
                        border: "1px solid rgba(226,232,240,.90)",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 11,
                          background: "#DBEAFE",
                          color: "#1D4ED8",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "0 0 auto",
                        }}
                      >
                        <i className={`bi ${icon}`}></i>
                      </div>

                      <div>
                        <div style={{ fontSize: 13, fontWeight: 950 }}>{title}</div>
                        <div className="text-muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
                          {text}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div
                    className="mt-3"
                    style={{
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,.10), rgba(124,58,237,.10))",
                      border: "1px solid rgba(147,197,253,.55)",
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#1E40AF" }}>
                      Designed for controlled inventory visibility and organized branch operations.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About System */}
        <section className="mb-3">
          <div className="p-3 p-md-4" style={cardStyle}>
            <div className="row g-3 align-items-center">
              <div className="col-12 col-lg-5">
                <div style={sectionBadgeStyle} className="mb-2">
                  <i className="bi bi-info-circle"></i>
                  About the System
                </div>

                <h2 style={sectionTitleStyle}>
                  A centralized platform for smarter inventory operations
                </h2>

                <p
                  className="text-muted mt-2 mb-0"
                  style={{ fontSize: 13, lineHeight: 1.7 }}
                >
                  The Smart Inventory System is designed to simplify multi-branch inventory
                  and distribution management. It helps an organization monitor stock,
                  manage products, process branch transfers, handle distributor orders, and
                  generate reports through a secure role-based web platform.
                </p>

                <p
                  className="text-muted mt-2 mb-0"
                  style={{ fontSize: 13, lineHeight: 1.7 }}
                >
                  The system improves visibility, reduces manual tracking, and keeps branch
                  operations organized by showing updated inventory, transfer activity,
                  order status, notifications, reports, and invoice information from one place.
                </p>
              </div>

              <div className="col-12 col-lg-7">
                <div className="row g-2">
                  {aboutHighlights.map((item) => (
                    <div className="col-12 col-md-6" key={item.title}>
                      <div
                        className="h-100"
                        style={{
                          borderRadius: 15,
                          border: "1px solid rgba(226,232,240,.95)",
                          background:
                            "linear-gradient(135deg, rgba(248,250,252,.95), rgba(255,255,255,.98))",
                          padding: "12px",
                        }}
                      >
                        <div className="d-flex align-items-start gap-3">
                          <div
                            style={{
                              ...iconBoxStyle,
                              width: 34,
                              height: 34,
                              borderRadius: 12,
                              fontSize: 15,
                            }}
                          >
                            <i className={`bi ${item.icon}`}></i>
                          </div>

                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 950,
                                color: "#0F172A",
                                marginBottom: 3,
                              }}
                            >
                              {item.title}
                            </div>

                            <div
                              className="text-muted"
                              style={{ fontSize: 12, lineHeight: 1.5 }}
                            >
                              {item.text}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Needed */}
        <section className="mb-3">
          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <div
                className="p-3 p-md-4 h-100"
                style={{
                  ...cardStyle,
                  background:
                    "linear-gradient(135deg, rgba(254,242,242,.92), rgba(255,255,255,.96))",
                }}
              >
                <div style={sectionBadgeStyle} className="mb-2">
                  <i className="bi bi-question-circle"></i>
                  Why This System Is Needed
                </div>

                <h2 style={sectionTitleStyle}>Solving common inventory problems</h2>

                <p className="text-muted mt-2 mb-0" style={{ fontSize: 13, lineHeight: 1.7 }}>
                  Many businesses face problems when inventory is managed manually or without
                  branch-wise tracking. This system reduces confusion by keeping product,
                  stock, transfer, order, and report information organized.
                </p>
              </div>
            </div>

            <div className="col-12 col-lg-8">
              <div className="row g-2 h-100">
                {problems.map((item) => (
                  <div className="col-12 col-md-6" key={item.title}>
                    <div
                      className="h-100"
                      style={{
                        borderRadius: 16,
                        border: "1px solid rgba(254,202,202,.80)",
                        background: "rgba(255,255,255,.92)",
                        padding: 14,
                        boxShadow: "0 8px 18px rgba(15,23,42,.04)",
                      }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 13,
                            background: "#FEF2F2",
                            color: "#DC2626",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "0 0 auto",
                          }}
                        >
                          <i className={`bi ${item.icon}`}></i>
                        </div>

                        <div>
                          <div style={{ fontSize: 14, fontWeight: 950, marginBottom: 4 }}>
                            {item.title}
                          </div>

                          <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.55 }}>
                            {item.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div>
              <div style={sectionBadgeStyle} className="mb-2">
                <i className="bi bi-check2-circle"></i>
                What the System Helps With
              </div>

              <h2 style={sectionTitleStyle}>Clear control over daily inventory activities</h2>
              <div className="text-muted" style={{ marginTop: 4, fontSize: 13 }}>
                The system is organized around the main tasks needed in branch-based inventory
                and distribution management.
              </div>
            </div>
          </div>

          <div className="row g-3">
            {benefits.map((item) => (
              <div className="col-12 col-md-6 col-xl-4" key={item.title}>
                <div className="p-3" style={{ ...cardStyle, minHeight: 118 }}>
                  <div className="d-flex align-items-start gap-3">
                    <div style={iconBoxStyle}>
                      <i className={`bi ${item.icon}`}></i>
                    </div>

                    <div>
                      <div style={{ fontSize: 15, fontWeight: 950, marginBottom: 4 }}>
                        {item.title}
                      </div>

                      <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.55 }}>
                        {item.text}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Key Modules */}
        <section className="mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div>
              <div style={sectionBadgeStyle} className="mb-2">
                <i className="bi bi-grid-1x2"></i>
                Key Modules
              </div>

              <h2 style={sectionTitleStyle}>Core functions included in the system</h2>
            </div>
          </div>

          <div className="row g-3">
            {features.map((f) => (
              <div className="col-12 col-md-6 col-xl-4" key={f.title}>
                <div className="p-3" style={{ ...cardStyle, minHeight: 120 }}>
                  <div className="d-flex align-items-start gap-3">
                    <div style={iconBoxStyle}>
                      <i className={`bi ${f.icon}`}></i>
                    </div>

                    <div>
                      <div style={{ fontSize: 15, fontWeight: 950, marginBottom: 4 }}>
                        {f.title}
                      </div>

                      <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.55 }}>
                        {f.text}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-3">
          <div className="p-3 p-md-4" style={cardStyle}>
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
              <div>
                <div style={sectionBadgeStyle} className="mb-2">
                  <i className="bi bi-kanban"></i>
                  System Workflow
                </div>

                <h2 style={sectionTitleStyle}>From login to final report</h2>
              </div>

              <div className="text-muted" style={{ fontSize: 13 }}>
                Main operational flow of the system
              </div>
            </div>

            <div className="row g-2">
              {workflow.map((item, index) => (
                <div className="col-12 col-md-6 col-xl-4" key={item}>
                  <div
                    className="h-100 d-flex align-items-center gap-3"
                    style={{
                      padding: "11px 12px",
                      borderRadius: 15,
                      background: index % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
                      border: "1px solid rgba(226,232,240,.90)",
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#EEF2FF",
                        color: "#4F46E5",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 950,
                        fontSize: 12,
                        flex: "0 0 auto",
                      }}
                    >
                      {index + 1}
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 800, color: "#334155" }}>
                      {item}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Role-Based Access */}
        <section className="mb-3">
          <div className="p-3 p-md-4" style={cardStyle}>
            <div className="row g-3 align-items-center">
              <div className="col-12 col-lg-5">
                <div style={sectionBadgeStyle} className="mb-2">
                  <i className="bi bi-person-lock"></i>
                  Role-Based Access Control
                </div>

                <h2 style={sectionTitleStyle}>
                  Access is controlled by assigned responsibility
                </h2>

                <p className="text-muted mt-2 mb-0" style={{ fontSize: 13, lineHeight: 1.7 }}>
                  The system is designed for authorized staff only. Each user can access
                  specific pages, data, and actions based on their assigned role.
                </p>
              </div>

              <div className="col-12 col-lg-7">
                <div className="row g-2">
                  {roles.map((roleName) => (
                    <div className="col-12 col-md-6 col-xl" key={roleName}>
                      <div
                        className="h-100 text-center"
                        style={{
                          padding: "12px 10px",
                          borderRadius: 15,
                          background:
                            "linear-gradient(135deg, rgba(248,250,252,.95), rgba(255,255,255,.98))",
                          border: "1px solid rgba(226,232,240,.95)",
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: "#EEF2FF",
                            color: "#4F46E5",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 8,
                          }}
                        >
                          <i className="bi bi-person-badge"></i>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 900, color: "#334155" }}>
                          {roleName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          className="text-center text-muted"
          style={{
            marginTop: 20,
            fontSize: 12,
          }}
        >
          Smart Inventory System · Practicum Project · By Sumaiya Islam Mily, BCSE, IUBAT
        </footer>
      </div>
    </div>
  );
}