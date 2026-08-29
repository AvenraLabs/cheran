import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/layout/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";

// Domain Pages
import DashboardPage from "./pages/DashboardPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import PendingReportsPage from "./pages/PendingReportsPage.jsx";
import ImportsPage from "./pages/ImportsPage.jsx";
import InvoiceBulkUploadPage from "./pages/InvoiceBulkUploadPage.jsx";
import LoadOrderUploadPage from "./pages/LoadOrderUploadPage.jsx";
import DirectSalesPage from "./pages/DirectSalesPage.jsx";
import CreateDirectSalePage from "./pages/CreateDirectSalePage.jsx";
import DealersPage from "./pages/DealersPage.jsx";
import CommissionProceedingsPage from "./pages/CommissionProceedingsPage.jsx";
import CommissionBatchDetailPage from "./pages/CommissionBatchDetailPage.jsx";

// Core ERP Pages
import ItemsPage from "./pages/ItemsPage.jsx";
import UnitsPage from "./pages/UnitsPage.jsx";
import SuppliersPage from "./pages/SuppliersPage.jsx";
import InventoryStockPage from "./pages/InventoryStockPage.jsx";
import StockReceiptsPage from "./pages/StockReceiptsPage.jsx";
import ProductionPage from "./pages/ProductionPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import SalaryPage from "./pages/SalaryPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2F6F5E] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-semibold text-[#52607D]">Verifying session...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

/**
 * Route guard for Admin-only pages
 */
/**
 * Route guard for Admin-only pages
 */
function AdminRoute({ children }) {
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();

  if (role !== "ADMIN") {
    return <Navigate to="/projects" replace />;
  }

  return children;
}

/**
 * Route guard for User + Admin pages (excludes DEALER)
 */
function UserOrAdminRoute({ children }) {
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();

  if (role === "DEALER") {
    return <Navigate to="/projects" replace />;
  }

  return children;
}

/**
 * Route guard for Dealer + Admin pages (excludes USER)
 */
function DealerOrAdminRoute({ children }) {
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();

  if (role === "USER") {
    return <Navigate to="/projects" replace />;
  }

  return children;
}

/**
 * Index Route Handler: Only Admin gets Dashboard, User & Dealer land on /projects
 */
function IndexRoute() {
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();

  if (role !== "ADMIN") {
    return <Navigate to="/projects" replace />;
  }

  return <DashboardPage />;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Application Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          {/* Index Route */}
          <Route index element={<IndexRoute />} />

          {/* Projects & Excel Imports (Allowed for ADMIN, USER, DEALER) */}
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="imports" element={<ImportsPage />} />

          {/* Pendency Reports (Allowed for DEALER & ADMIN, Forbidden for USER) */}
          <Route
            path="pending-reports"
            element={
              <DealerOrAdminRoute>
                <PendingReportsPage />
              </DealerOrAdminRoute>
            }
          />

          {/* Load Order Import & Commission Overview (Allowed for USER & ADMIN, Forbidden for DEALER) */}
          <Route
            path="imports/load-order"
            element={
              <UserOrAdminRoute>
                <LoadOrderUploadPage />
              </UserOrAdminRoute>
            }
          />
          <Route
            path="commissions"
            element={
              <UserOrAdminRoute>
                <CommissionProceedingsPage />
              </UserOrAdminRoute>
            }
          />
          <Route
            path="commission"
            element={
              <UserOrAdminRoute>
                <CommissionProceedingsPage />
              </UserOrAdminRoute>
            }
          />
          <Route
            path="dealers/commissions"
            element={
              <UserOrAdminRoute>
                <CommissionProceedingsPage />
              </UserOrAdminRoute>
            }
          />
          <Route
            path="dealers/commission"
            element={
              <UserOrAdminRoute>
                <CommissionProceedingsPage />
              </UserOrAdminRoute>
            }
          />

          {/* Admin-Only Domain Routes */}
          <Route
            path="commissions/:id"
            element={
              <AdminRoute>
                <CommissionBatchDetailPage />
              </AdminRoute>
            }
          />
          <Route
            path="dealers"
            element={
              <AdminRoute>
                <DealersPage />
              </AdminRoute>
            }
          />
          <Route
            path="sales"
            element={
              <AdminRoute>
                <DirectSalesPage />
              </AdminRoute>
            }
          />
          <Route
            path="sales/new"
            element={
              <AdminRoute>
                <CreateDirectSalePage />
              </AdminRoute>
            }
          />

          {/* Admin-Only Routes */}
          <Route
            path="inventory"
            element={
              <AdminRoute>
                <InventoryStockPage />
              </AdminRoute>
            }
          />
          <Route
            path="inventory/receipts"
            element={
              <AdminRoute>
                <StockReceiptsPage />
              </AdminRoute>
            }
          />
          <Route
            path="inventory/production"
            element={
              <AdminRoute>
                <ProductionPage />
              </AdminRoute>
            }
          />
          <Route
            path="items"
            element={
              <AdminRoute>
                <ItemsPage />
              </AdminRoute>
            }
          />
          <Route
            path="units"
            element={
              <AdminRoute>
                <UnitsPage />
              </AdminRoute>
            }
          />
          <Route
            path="suppliers"
            element={
              <AdminRoute>
                <SuppliersPage />
              </AdminRoute>
            }
          />
          <Route
            path="customers"
            element={
              <AdminRoute>
                <CustomersPage />
              </AdminRoute>
            }
          />
          <Route
            path="expenses"
            element={
              <AdminRoute>
                <ExpensesPage />
              </AdminRoute>
            }
          />
          <Route
            path="employees"
            element={
              <AdminRoute>
                <EmployeesPage />
              </AdminRoute>
            }
          />
          <Route
            path="salary"
            element={
              <AdminRoute>
                <SalaryPage />
              </AdminRoute>
            }
          />
          <Route
            path="reports"
            element={
              <AdminRoute>
                <ReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="users"
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="settings"
            element={
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            }
          />
          <Route
            path="imports/invoices"
            element={
              <AdminRoute>
                <InvoiceBulkUploadPage />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
