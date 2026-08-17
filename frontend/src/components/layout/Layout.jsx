import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { Toaster } from "sonner";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-[#FAFAF8] text-[#14213D]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Outlet />
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export default Layout;
