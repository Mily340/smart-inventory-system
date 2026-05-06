// frontend/src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: "bi-building",
      title: "Multi-Branch Management",
      text: "Manage inventory, users, stock, orders, and transfers across multiple branches.",
    },
    {
      icon: "bi-box-seam",
      title: "Inventory Tracking",
      text: "Track product quantities, reorder levels, stock-in, stock-out, and adjustments.",
    },
    {
      icon: "bi-arrow-left-right",
      title: "Stock Transfer",
      text: "Create, approve, dispatch, and receive transfer requests between branches.",
    },
    {
      icon: "bi-receipt",
      title: "Order & Invoice",
      text: "Create distributor orders, update workflow, and generate printable invoices.",
    },
    {
      icon: "bi-truck",
      title: "Delivery Workflow",
      text: "Manage delivery activities and track order movement after dispatch.",
    },
    {
      icon: "bi-graph-up-arrow",
      title: "Reports & Alerts",
      text: "Generate reports for stock, orders, transfers, and low-stock notifications.",
    },
  ];

  const roles = [
    "Super Admin",
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

  const workflow = [
    "User login with role-based access",
    "Product and branch setup",
    "Stock-in, stock-out, and adjustment",
    "Transfer request and approval",
    "Distributor order and invoice generation",
    "Delivery, reports, and notifications",
  ];

  const pageStyle = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, rgba(239,246,255,1), rgba(255,255,255,1), rgba(245,243,255,.75))",
    color: "#0F172A",
  };

  const shellStyle = {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "16px 16px 24px",
  };

  const navStyle = {
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,.35)",
    background: "rgba(255,255,255,.86)",
    boxShadow: "0 10px 24px rgba(15,23,42,.06)",
    padding: "12px 16px",
    backdropFilter: "blur(10px)",
  };

  const heroStyle = {
    borderRadius: 22,
    border: "1px solid rgba(148,163,184,.35)",
    background:
      "linear-gradient(135deg, rgba(219,234,254,.88), rgba(255,255,255,.98), rgba(237,233,254,.72))",
    boxShadow: "0 14px 32px rgba(15,23,42,.08)",
    overflow: "hidden",
  };

  const cardStyle = {
    borderRadius: 16,
    border: "1px solid rgba(148,163,184,.30)",
    background: "rgba(255,255,255,.90)",
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
        <div className="row g-3 align-items-stretch mb-3">
          <div className="col-12 col-xl-8">
            <div className="p-4 h-100" style={heroStyle}>
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
                Smart Business Operations Test 
              </div>

              <h1
                style={{
                  fontSize: "clamp(28px, 3.4vw, 42px)",
                  fontWeight: 950,
                  letterSpacing: -0.8,
                  lineHeight: 1.08,
                  marginBottom: 12,
                  color: "#0F172A",
                  maxWidth: 720,
                }}
              >
                Smart Multi-Branch Inventory System
              </h1>

              <p
                className="text-muted"
                style={{
                  fontSize: 15,
                  maxWidth: 700,
                  lineHeight: 1.65,
                  marginBottom: 18,
                }}
              >
                A web-based system for managing products, inventory, stock transfers,
                distributor orders, delivery workflows, reports, notifications, and branch-level
                operations from one centralized platform.
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                  className="btn btn-primary"
                  style={{ borderRadius: 12, fontWeight: 850, padding: "9px 16px" }}
                  onClick={() => navigate("/login")}
                >
                  Get Started
                </button>

                <button
                  className="btn btn-outline-secondary"
                  style={{
                    borderRadius: 12,
                    fontWeight: 800,
                    padding: "9px 16px",
                    background: "rgba(255,255,255,.70)",
                  }}
                  onClick={() => navigate("/catalog")}
                >
                  View Public Catalog
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

          {/* Workflow */}
          <div className="col-12 col-xl-4">
            <div className="p-3 h-100" style={cardStyle}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div style={iconBoxStyle}>
                  <i className="bi bi-kanban"></i>
                </div>

                <div>
                  <div style={{ fontSize: 17, fontWeight: 950 }}>System Workflow</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    Main operational flow
                  </div>
                </div>
              </div>

              <div className="d-grid gap-2">
                {workflow.map((item, index) => (
                  <div
                    key={item}
                    className="d-flex align-items-center gap-2"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: index % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
                      border: "1px solid rgba(226,232,240,.90)",
                    }}
                  >
                    <div
                      style={{
                        width: 23,
                        height: 23,
                        borderRadius: "50%",
                        background: "#EEF2FF",
                        color: "#4F46E5",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 950,
                        fontSize: 11,
                        flex: "0 0 auto",
                      }}
                    >
                      {index + 1}
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 750, color: "#334155" }}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <section className="mb-3">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-2">
            <div>
              <h2 className="m-0" style={{ fontWeight: 950, fontSize: 24 }}>
                Key Modules
              </h2>
              <div className="text-muted" style={{ marginTop: 3, fontSize: 13 }}>
                Core functions included in the system.
              </div>
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

        {/* Roles and CTA */}
        <div className="row g-3">
          <div className="col-12 col-lg-7">
            <div className="p-3" style={cardStyle}>
              <div style={{ fontSize: 18, fontWeight: 950, marginBottom: 6 }}>
                Role-Based Access Control
              </div>

              <div className="text-muted mb-3" style={{ fontSize: 13 }}>
                Each user sees only the pages and actions allowed for their assigned role.
              </div>

              <div className="d-flex flex-wrap gap-2">
                {roles.map((roleName) => (
                  <span
                    key={roleName}
                    style={{
                      padding: "7px 11px",
                      borderRadius: 999,
                      background: "#F8FAFC",
                      border: "1px solid rgba(148,163,184,.35)",
                      fontWeight: 800,
                      fontSize: 12,
                      color: "#334155",
                    }}
                  >
                    {roleName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div
              className="p-3 h-100"
              style={{
                ...cardStyle,
                background:
                  "linear-gradient(135deg, rgba(37,99,235,.95), rgba(124,58,237,.92))",
                color: "#FFFFFF",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 950, marginBottom: 6 }}>
                Explore the System
              </div>

              <div style={{ opacity: 0.88, fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>
                Start from the public catalog or enter the staff dashboard using role-based
                login credentials.
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-light btn-sm"
                  style={{ borderRadius: 10, fontWeight: 900, padding: "8px 13px" }}
                  onClick={() => navigate("/catalog")}
                >
                  Catalog
                </button>

                <button
                  className="btn btn-outline-light btn-sm"
                  style={{ borderRadius: 10, fontWeight: 900, padding: "8px 13px" }}
                  onClick={() => navigate("/login")}
                >
                  Staff Login
                </button>
              </div>
            </div>
          </div>
        </div>

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