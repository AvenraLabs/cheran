import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Button from "./Button.jsx";

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
  if (totalItems === 0) return null;

  const startItem = Math.min((page - 1) * limit + 1, totalItems);
  const endItem = Math.min(page * limit, totalItems);

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
          <strong className="text-[#14213D]">{totalItems.toLocaleString()}</strong> items
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-[#E4E1D8] pl-3">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
              className="px-2 py-1 text-xs bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E] cursor-pointer"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          className="px-2 py-1"
          title="First Page"
        >
          <ChevronsLeft size={14} />
        </Button>

        {/* Previous Page Button */}
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-2.5 py-1"
          title="Previous Page"
        >
          <ChevronLeft size={14} />
        </Button>

        {/* Numbered Page Buttons */}
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer ${
              p === page
                ? "bg-[#2F6F5E] text-white shadow-xs"
                : "bg-white border border-[#E4E1D8] text-[#14213D] hover:bg-[#EDEAE1]"
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next Page Button */}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-2.5 py-1"
          title="Next Page"
        >
          <ChevronRight size={14} />
        </Button>

        {/* Last Page Button */}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="px-2 py-1"
          title="Last Page"
        >
          <ChevronsRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
