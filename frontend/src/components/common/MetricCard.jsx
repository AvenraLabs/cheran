import React from "react";

export function MetricCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#52607D]">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-[8px] bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold font-display text-[#14213D]">
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-xs text-[#52607D]">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
