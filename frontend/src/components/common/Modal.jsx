import React from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth, size = "md" }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    "2xl": "max-w-5xl",
    full: "max-w-6xl",
  };

  const widthClass = maxWidth || sizeClasses[size] || "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className={`bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_8px_32px_rgba(20,33,61,0.12)] w-full ${widthClass} relative my-6 max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDEAE1] shrink-0">
          <h3 className="text-base font-bold font-display text-[#14213D] truncate pr-2">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#52607D] hover:text-[#14213D] p-1.5 rounded-[6px] hover:bg-[#FAFAF8] cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
