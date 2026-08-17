import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/layout/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";

// Domain Pages
import DashboardPage from "./pages/DashboardPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import ImportsPage from "./pages/ImportsPage.jsx";
import DealersPage from "./pages/DealersPage.jsx";

// Core ERP Pages
import ItemsPage from "./pages/ItemsPage.jsx";
import UnitsPage from "./pages/UnitsPage.jsx";
import SuppliersPage from "./pages/SuppliersPage.jsx";
import InventoryStockPage from "./pages/InventoryStockPage.jsx";
import StockReceiptsPage from "./pages/StockReceiptsPage.jsx";
import CustomersPage from "./pages/CustomersPage.jsx";
import DirectSalesPage from "./pages/DirectSalesPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import EmployeesPage from "./pages/EmployeesPage.jsx";
import SalaryPage from "./pages/SalaryPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
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

export function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard & Operations Routes */}
        <Route path="/" element={<ProtectedLayout />}>
          {/* Operations & Government */}
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="dealers" element={<DealersPage />} />

          {/* Inventory & Materials */}
          <Route path="inventory" element={<InventoryStockPage />} />
          <Route path="inventory/receipts" element={<StockReceiptsPage />} />
          <Route path="items" element={<ItemsPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />

          {/* Sales & Commercial */}
          <Route path="sales" element={<DirectSalesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />

          {/* Human Resources */}
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="salary" element={<SalaryPage />} />

          {/* Reports & Configuration */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
