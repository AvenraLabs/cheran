import React from "react";
import { format } from "date-fns";
import { Menu } from "lucide-react";
import { useLayout } from "./Layout.jsx";

export function Navbar({ title, subtitle, actions }) {
  const { toggleMobileNav } = useLayout();

  return (
    <header className="min-h-16 py-3 px-4 sm:px-6 md:px-8 bg-white border-b border-[#E4E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shrink-0 shadow-[0_1px_2px_rgba(20,33,61,0.02)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={toggleMobileNav}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 -ml-1 text-[#14213D] hover:bg-[#FAFAF8] active:bg-[#EDEAE1] border border-[#E4E1D8] rounded-[8px] transition-colors cursor-pointer shrink-0"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold font-display text-[#14213D] leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-[#52607D] truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 flex-wrap">
        <div className="text-xs text-[#52607D] hidden xl:block font-mono">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
