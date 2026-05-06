// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";

import Login from "./pages/Login";
import Users from "./pages/Users";

import Catalog from "./pages/Catalog";
import CatalogProduct from "./pages/CatalogProduct";

import Dashboard from "./pages/Dashboard";

import Branches from "./pages/Branches";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import BranchStock from "./pages/BranchStock";
import Transfers from "./pages/Transfers";
import Distributors from "./pages/Distributors";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import BranchInactive from "./pages/BranchInactive";

import ProtectedRoute from "./components/ProtectedRoute";

const SUPER_ADMIN = ["SUPER_ADMIN"];
const INVENTORY_OFFICER = ["INVENTORY_OFFICER"];
const BRANCH_MANAGER = ["BRANCH_MANAGER"];
const BRANCH_STAFF = ["BRANCH_STAFF"];
const RIDER = ["DELIVERY_RIDER"];

const ADMIN_STAFF = [...SUPER_ADMIN, ...INVENTORY_OFFICER];
const BRANCH_OPERATION_USERS = [...BRANCH_MANAGER, ...BRANCH_STAFF];

const INVENTORY_ACCESS = [...ADMIN_STAFF, ...BRANCH_MANAGER];
const BRANCH_STOCK_ACCESS = [...ADMIN_STAFF, ...BRANCH_OPERATION_USERS];
const ORDER_ACCESS = [...ADMIN_STAFF, ...BRANCH_OPERATION_USERS];
const TRANSFER_ACCESS = [...ADMIN_STAFF, ...BRANCH_MANAGER];
const DELIVERY_ACCESS = [...RIDER, ...ADMIN_STAFF, ...BRANCH_MANAGER];
const REPORT_ACCESS = [...ADMIN_STAFF, ...BRANCH_MANAGER];

const ALL_LOGGED_IN = [
  ...SUPER_ADMIN,
  ...INVENTORY_OFFICER,
  ...BRANCH_MANAGER,
  ...BRANCH_STAFF,
  ...RIDER,
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<CatalogProduct />} />

        {/* Inactive branch notice */}
        <Route
          path="/branch-inactive"
          element={
            <ProtectedRoute allowedRoles={[...BRANCH_MANAGER, ...BRANCH_STAFF]}>
              <BranchInactive />
            </ProtectedRoute>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_STAFF, ...BRANCH_MANAGER]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin-level management pages */}
        <Route
          path="/branches"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Branches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/distributors"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Distributors />
            </ProtectedRoute>
          }
        />

        {/* Branch-aware operational pages */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={INVENTORY_ACCESS}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/branch-stock"
          element={
            <ProtectedRoute allowedRoles={BRANCH_STOCK_ACCESS}>
              <BranchStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={ORDER_ACCESS}>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfers"
          element={
            <ProtectedRoute allowedRoles={TRANSFER_ACCESS}>
              <Transfers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/deliveries"
          element={
            <ProtectedRoute allowedRoles={DELIVERY_ACCESS}>
              <Deliveries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={REPORT_ACCESS}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Admin-only pages */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={SUPER_ADMIN}>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* Everyone logged-in */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={ALL_LOGGED_IN}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}