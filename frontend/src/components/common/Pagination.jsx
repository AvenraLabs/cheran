import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Check } from "lucide-react";

function LimitDropdown({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs bg-white border border-[#E4E1D8] hover:border-[#2F6F5E] rounded-[6px] text-[#14213D] font-semibold focus:outline-none focus:ring-1 focus:ring-[#2F6F5E] cursor-pointer shadow-2xs flex items-center gap-1.5 transition-colors"
      >
        <span>{value}</span>
        <ChevronDown size={12} className={`text-[#52607D] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-1.5 left-0 z-50 min-w-[70px] bg-white border border-[#E4E1D8] rounded-[8px] shadow-lg py-1 select-none animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#EAF3F0] text-[#2F6F5E] font-bold"
                    : "text-[#14213D] hover:bg-[#FAFAF8] hover:text-[#2F6F5E]"
                }`}
              >
                <span>{opt}</span>
                {isSelected && <Check size={12} className="text-[#2F6F5E] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Pagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 20,
  onPageChange,
  onLimitChange,
  limitOptions = [20, 50, 100, 250],
  className = "",
}) {
  const safeTotal = Number(totalItems) || 0;
  if (safeTotal <= 0) return null;

  const startItem = Math.min((page - 1) * limit + 1, safeTotal);
  const endItem = Math.min(page * limit, safeTotal);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxVisiblePages;
      } else if (page >= totalPages - 2) {
        start = totalPages - maxVisiblePages + 1;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`px-4 py-3 border-t border-[#EDEAE1] bg-[#FAFAF8] flex flex-col sm:flex-row items-center justify-between gap-3 select-none ${className}`}
    >
      {/* Items Range & Limit Selector */}
      <div className="flex items-center gap-3 text-xs text-[#52607D]">
        <span>
          Showing <strong className="text-[#14213D]">{startItem}</strong> to{" "}
          <strong className="text-[#14213D]">{endItem}</strong> of{" "}
          <strong className="text-[#14213D]">{safeTotal.toLocaleString()}</strong> items
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-[#E4E1D8] pl-3">
            <span>Per page:</span>
            <LimitDropdown
              value={limit}
              options={limitOptions}
              onChange={onLimitChange}
            />
          </div>
        )}
      </div>

      {/* Pagination Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="min-w-[28px] h-7 px-2 flex items-center justify-center text-xs font-semibold rounded-[6px] border border-[#E4E1D8] bg-white text-[#52607D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E] hover:border-[#D3E6E0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous Page Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="min-w-[28px] h-7 px-2 flex items-center justify-center text-xs font-semibold rounded-[6px] border border-[#E4E1D8] bg-white text-[#52607D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E] hover:border-[#D3E6E0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Numbered Page Buttons */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
              p === page
                ? "bg-[#2F6F5E] text-white border border-[#2F6F5E] shadow-xs"
                : "bg-white border border-[#E4E1D8] text-[#14213D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E] hover:border-[#D3E6E0]"
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next Page Button */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="min-w-[28px] h-7 px-2 flex items-center justify-center text-xs font-semibold rounded-[6px] border border-[#E4E1D8] bg-white text-[#52607D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E] hover:border-[#D3E6E0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="min-w-[28px] h-7 px-2 flex items-center justify-center text-xs font-semibold rounded-[6px] border border-[#E4E1D8] bg-white text-[#52607D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E] hover:border-[#D3E6E0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Last Page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
