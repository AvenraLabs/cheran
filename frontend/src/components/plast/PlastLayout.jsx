import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PlastSidebar from "./PlastSidebar.jsx";
import { LayoutContext } from "../layout/Layout.jsx";
import { Toaster } from "sonner";

export function PlastLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("cheran_plast_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileNavOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("cheran_plast_sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    }
  };

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <LayoutContext.Provider
      value={{
        isMobileNavOpen,
        isSidebarCollapsed,
        toggleSidebar,
        toggleMobileNav,
        closeMobileNav,
      }}
    >
      <div className="flex h-screen max-h-screen w-screen overflow-hidden bg-[#FAFAF8] text-[#14213D]">
        <PlastSidebar
          isOpen={isMobileNavOpen}
          isCollapsed={isSidebarCollapsed}
          onClose={closeMobileNav}
          onToggleCollapse={toggleSidebar}
        />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300">
          <Outlet />
        </div>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </LayoutContext.Provider>
  );
}

export default PlastLayout;
