import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RegisterRequest from "./pages/RegisterRequest";
import RegistrationRequests from "./pages/RegistrationRequests";
import Users from "./pages/Users";

import Catalog from "./pages/Catalog";
import CatalogProduct from "./pages/CatalogProduct";

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

const STAFF_ROLES = ["SUPER_ADMIN", "BRANCH_MANAGER", "INVENTORY_OFFICER"];
const DELIVERY_ROLES = ["DELIVERY_RIDER", ...STAFF_ROLES];
const ADMIN_ONLY = ["SUPER_ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterRequest />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/catalog/:id" element={<CatalogProduct />} />

        {/* Staff */}
        <Route
          path="/branches"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Branches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/branch-stock"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <BranchStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfers"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Transfers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/distributors"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Distributors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Deliveries: Rider + Staff */}
        <Route
          path="/deliveries"
          element={
            <ProtectedRoute allowedRoles={DELIVERY_ROLES}>
              <Deliveries />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Admin-only approvals page */}
        <Route
          path="/admin/registration-requests"
          element={
            <ProtectedRoute allowedRoles={ADMIN_ONLY}>
              <RegistrationRequests />
            </ProtectedRoute>
          }
        />

        {/* Admin-only user management */}
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
            <ProtectedRoute allowedRoles={DELIVERY_ROLES}>
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