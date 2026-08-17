import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileSpreadsheet,
  UploadCloud,
  Users,
  Sprout,
} from "lucide-react";

export function Sidebar() {
  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Government Projects", path: "/projects", icon: FileSpreadsheet },
    { label: "Excel Imports", path: "/imports", icon: UploadCloud },
    { label: "Dealers Directory", path: "/dealers", icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E4E1D8] flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-[#EDEAE1] flex items-center gap-3">
        <div className="w-9 h-9 rounded-[8px] bg-[#2F6F5E] text-white flex items-center justify-center font-bold font-display shadow-xs">
          <Sprout size={20} />
        </div>
        <div>
          <div className="text-sm font-bold font-display tracking-tight text-[#14213D]">
            CHERAN PLAST
          </div>
          <div className="text-[11px] font-medium text-[#52607D]">
            Horticulture Govt Projects
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C97AB] px-3 py-2">
          Management
        </div>

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#EAF3F0] text-[#2F6F5E] font-semibold"
                  : "text-[#52607D] hover:bg-[#FAFAF8] hover:text-[#14213D]"
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#EDEAE1] bg-[#FAFAF8]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2F6F5E] animate-pulse" />
          <span className="text-xs font-medium text-[#52607D]">TN Horti DB Connected</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
