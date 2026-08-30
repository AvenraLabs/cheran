import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Factory,
  ShoppingCart,
  Truck,
  Building,
  Package,
  Users,
  BarChart3,
  Receipt,
  LogOut,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

export function PlastSidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }) {
  const { user, logout, setActiveCompany } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role || "ADMIN").toUpperCase();

  const navigationSections = [
    {
      title: "Operations & Sales",
      items: [
        { label: "Dashboard", path: "/plast", icon: LayoutDashboard },
        { label: "Sales & Billing", path: "/plast/sales", icon: ShoppingCart },
        { label: "Customers", path: "/plast/customers", icon: Users },
      ],
    },
    {
      title: "Manufacturing & Inventory",
      items: [
        { label: "Stock On-Hand", path: "/plast/stock", icon: Boxes },
        { label: "Daily Production", path: "/plast/production", icon: Factory },
        { label: "Raw Purchases", path: "/plast/purchases", icon: Truck },
        { label: "Suppliers", path: "/plast/suppliers", icon: Building },
        { label: "Items", path: "/plast/items", icon: Package },
      ],
    },
    {
      title: "Financials & Intelligence",
      items: [
        { label: "Reports & Analytics", path: "/plast/reports", icon: BarChart3 },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
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
              <div className="w-8 h-8 rounded-[8px] bg-[#1E4D40] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                CP
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold font-display tracking-tight text-[#14213D] truncate">
                  CHERAN PLAST
                </div>
                <div className="text-[9px] font-medium text-[#52607D] truncate">
                  Inventory & Sales ERP
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

          {/* Company Switcher: Switch to Cheran Irrigation */}
          <div className="p-2.5 bg-[#EAF3F0] border-b border-[#D3E6E0]">
            <button
              type="button"
              onClick={() => {
                setActiveCompany("irrigation");
                navigate("/");
                if (onClose) onClose();
              }}
              className="w-full py-1.5 px-2.5 bg-white hover:bg-emerald-50 text-[#1E4D40] border border-[#B8D7CE] rounded-[7px] text-[11px] font-bold flex items-center justify-between transition-all shadow-xs cursor-pointer active:scale-98"
              title="Switch to Cheran Irrigation"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <ArrowLeftRight size={13} className="text-[#2F6F5E] shrink-0" />
                <span className="truncate">Switch to Cheran Irrigation</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#1E4D40] text-white rounded font-mono shrink-0">
                Irrigation
              </span>
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
                    end={item.path === "/plast"}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
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
                {user?.name?.slice(0, 1) || user?.username?.slice(0, 1)?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#14213D] truncate">
                  {user?.name || user?.username || "Administrator"}
                </div>
                <div className="text-[10px] text-[#52607D] truncate uppercase font-mono font-medium">
                  {role} • PLAST
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

export default PlastSidebar;
