import React from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div
        className={`bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_8px_32px_rgba(20,33,61,0.12)] w-full ${maxWidth} relative my-8`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDEAE1]">
          <h3 className="text-base font-bold font-display text-[#14213D]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#52607D] hover:text-[#14213D] p-1 rounded-[6px] hover:bg-[#FAFAF8] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
