import React, { useState, useEffect, createContext, useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import { Toaster } from "sonner";

export const LayoutContext = createContext({
  isMobileNavOpen: false,
  toggleMobileNav: () => {},
  closeMobileNav: () => {},
});

export const useLayout = () => useContext(LayoutContext);

export function Layout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);
  const closeMobileNav = () => setIsMobileNavOpen(false);

  return (
    <LayoutContext.Provider value={{ isMobileNavOpen, toggleMobileNav, closeMobileNav }}>
      <div className="flex min-h-screen bg-[#FAFAF8] text-[#14213D] relative">
        <Sidebar isOpen={isMobileNavOpen} onClose={closeMobileNav} />
        <div className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>
        <Toaster position="top-right" richColors closeButton />
      </div>
    </LayoutContext.Provider>
  );
}

export default Layout;
