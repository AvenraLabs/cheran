import React from "react";
import { FolderOpen } from "lucide-react";

export function SkeletonLoader({ rows = 5, className = "" }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-[#EDEAE1] rounded-[6px] w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title = "No records found", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#E4E1D8] rounded-[10px]">
      <div className="w-12 h-12 rounded-full bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center mb-3">
        <FolderOpen size={24} />
      </div>
      <h3 className="text-sm font-semibold text-[#14213D]">{title}</h3>
      {description && <p className="text-xs text-[#52607D] mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
