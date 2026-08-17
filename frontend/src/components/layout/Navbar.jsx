import React from "react";
import { format } from "date-fns";

export function Navbar({ title, subtitle, actions }) {
  return (
    <header className="h-16 px-8 bg-white border-b border-[#E4E1D8] flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-lg font-bold font-display text-[#14213D] leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#52607D]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-[#52607D] hidden md:block">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default Navbar;
