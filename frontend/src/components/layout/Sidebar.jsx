import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  Users,
  Boxes,
  ClipboardList,
  Package,
  Scale,
  Truck,
  UserCheck,
  Receipt,
  UserCog,
  DollarSign,
  BarChart3,
  LogOut,
  X,
  Factory,
  ShieldCheck,
  FileJson,
  UploadCloud,
  ShoppingCart,
  Settings,
  Menu,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const role = (user?.role || "USER").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isDealer = role === "DEALER";

  let navigationSections = [];

  if (isAdmin) {
    navigationSections = [
      {
        title: "Operations & Govt",
        items: [
          { label: "Dashboard", path: "/", icon: LayoutDashboard },
          { label: "Govt Projects", path: "/projects", icon: FileSpreadsheet },
          { label: "Pendency Report", path: "/pending-reports", icon: ClipboardCheck },
          { label: "Direct Sales", path: "/sales", icon: ShoppingCart },
          { label: "Load Order Upload", path: "/imports/load-order", icon: UploadCloud },
          { label: "Excel Imports", path: "/imports", icon: FileText },
          { label: "Dealers Directory", path: "/dealers", icon: Users },
          { label: "Commission", path: "/commissions", icon: Receipt },
        ],
      },
      {
        title: "Inventory & Materials",
        items: [
          { label: "Stock On-Hand", path: "/inventory", icon: Boxes },
          { label: "Purchase Receipts", path: "/inventory/receipts", icon: ClipboardList },
          { label: "Daily Production", path: "/inventory/production", icon: Factory },
          { label: "Item Master", path: "/items", icon: Package },
          { label: "Units of Measure", path: "/units", icon: Scale },
          { label: "Suppliers / Vendors", path: "/suppliers", icon: Truck },
        ],
      },
      {
        title: "Financials & Clients",
        items: [
          { label: "Customers", path: "/customers", icon: UserCheck },
          { label: "Expenses", path: "/expenses", icon: Receipt },
        ],
      },
      {
        title: "Human Resources",
        items: [
          { label: "Staff & Attendance", path: "/employees", icon: UserCog },
          { label: "Payroll / Salary", path: "/salary", icon: DollarSign },
        ],
      },
      {
        title: "Reports & Configuration",
        items: [
          { label: "Reports & Analytics", path: "/reports", icon: BarChart3 },
          { label: "User Management", path: "/users", icon: ShieldCheck },
          { label: "Scheme GST Settings", path: "/settings", icon: Settings },
          { label: "Invoice Bulk Upload", path: "/imports/invoices", icon: FileJson },
        ],
      },
    ];
  } else if (isDealer) {
    navigationSections = [
      {
        title: "Operations & Govt",
        items: [
          { label: "Govt Projects", path: "/projects", icon: FileSpreadsheet },
          { label: "Pendency Report", path: "/pending-reports", icon: ClipboardCheck },
          { label: "Excel Imports", path: "/imports", icon: FileText },
          { label: "Dealers Directory", path: "/dealers", icon: Users },
        ],
      },
    ];
  } else {
    // 'USER' role: Operations & Govt group
    navigationSections = [
      {
        title: "Operations & Govt",
        items: [
          { label: "Govt Projects", path: "/projects", icon: FileSpreadsheet },
          { label: "Pendency Report", path: "/pending-reports", icon: ClipboardCheck },
          { label: "Direct Sales", path: "/sales", icon: ShoppingCart },
          { label: "Load Order Upload", path: "/imports/load-order", icon: UploadCloud },
          { label: "Excel Imports", path: "/imports", icon: FileText },
          { label: "Dealers Directory", path: "/dealers", icon: Users },
          { label: "Commission", path: "/commissions", icon: Receipt },
        ],
      },
    ];
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar (Desktop pinned in-flow h-full, Mobile fixed drawer) */}
      <aside
        className={`bg-white border-r border-[#E4E1D8] flex flex-col h-full max-h-screen select-none transition-all duration-300 ease-in-out ${
          /* Mobile Drawer Positioning */
          isOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] translate-x-0 shadow-2xl"
            : "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] -translate-x-full lg:translate-x-0"
        } ${
          /* Desktop Pinned & Collapse */
          isCollapsed
            ? "lg:w-0 lg:min-w-0 lg:max-w-0 lg:overflow-hidden lg:border-r-0 lg:p-0 lg:opacity-0 lg:pointer-events-none lg:shadow-none"
            : "lg:relative lg:w-64 lg:min-w-[16rem] lg:max-w-[16rem] lg:shrink-0 lg:h-full lg:opacity-100 lg:pointer-events-auto lg:shadow-[1px_0_2px_rgba(20,33,61,0.02)]"
        }`}
      >
        {/* Inner Fixed-Width Wrapper to prevent text squishing during collapse transition */}
        <div className="w-64 min-w-[16rem] max-w-[16rem] flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#EDEAE1] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/icon.png"
                alt="Cheran Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold font-display tracking-tight text-[#14213D] truncate">
                  CHERAN IRRIGATION
                </div>
                <div className="text-[9px] font-medium text-[#52607D] truncate">
                  {isDealer ? "Dealer Portal" : "Horticulture & Irrigation ERP"}
                </div>
              </div>
            </div>

            {/* Close button visible only on mobile drawer */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close mobile sidebar"
              className="lg:hidden p-1.5 text-[#52607D] hover:text-[#14213D] hover:bg-[#FAFAF8] rounded-[6px] transition-colors cursor-pointer shrink-0"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav Menu */}
          <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
            {navigationSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C97AB] px-3 py-1">
                  {section.title}
                </div>

                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/" || item.path === "/inventory" || item.path === "/imports"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[#EAF3F0] text-[#2F6F5E] font-bold shadow-xs"
                          : "text-[#52607D] hover:bg-[#FAFAF8] hover:text-[#14213D]"
                      }`
                    }
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* User Session Footer */}
          <div className="p-3 border-t border-[#EDEAE1] bg-[#FAFAF8] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2F6F5E]/15 text-[#2F6F5E] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                {user?.name?.slice(0, 1) || user?.username?.slice(0, 1)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#14213D] truncate">
                  {user?.name || user?.username || "User"}
                </div>
                <div className="text-[10px] text-[#52607D] truncate uppercase font-mono font-medium">
                  {role}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-[#8C97AB] hover:text-[#B0403A] hover:bg-[#FDF2F1] rounded-[6px] transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
