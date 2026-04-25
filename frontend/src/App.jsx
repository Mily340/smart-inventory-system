// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

import ProtectedRoute from "./components/ProtectedRoute";

// Role groups
const ADMIN_STAFF = ["SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"];
const BRANCH_STAFF = ["BRANCH_STAFF"];
const RIDER = ["DELIVERY_RIDER"];

const ALL_LOGGED_IN = [...ADMIN_STAFF, ...BRANCH_STAFF, ...RIDER];
const ADMIN_ONLY = ["SUPER_ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<CatalogProduct />} />

        {/* Dashboard (Admin Staff) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Staff only */}
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
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Transfers />
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
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={ADMIN_STAFF}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Orders: Admin Staff + Branch Staff */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_STAFF, ...BRANCH_STAFF]}>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Branch Stock: Admin Staff + Branch Staff */}
        <Route
          path="/branch-stock"
          element={
            <ProtectedRoute allowedRoles={[...ADMIN_STAFF, ...BRANCH_STAFF]}>
              <BranchStock />
            </ProtectedRoute>
          }
        />

        {/* Deliveries: Rider + Admin Staff */}
        <Route
          path="/deliveries"
          element={
            <ProtectedRoute allowedRoles={[...RIDER, ...ADMIN_STAFF]}>
              <Deliveries />
            </ProtectedRoute>
          }
        />

        {/* Admin-only pages */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
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

        {/* Home */}
        <Route path="/" element={<Navigate to="/catalog" replace />} />
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </BrowserRouter>
  );
}