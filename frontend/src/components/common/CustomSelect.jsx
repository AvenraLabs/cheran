import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";

export function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  searchable = true,
  clearable = false,
  disabled = false,
  className = "",
  size = "md",
  icon: Icon = null,
  label = null,
  error = null,
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuStyle, setMenuStyle] = useState({});
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options array to { value, label, subtitle, badge }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : opt.name || opt.value || opt.id,
        subtitle: opt.subtitle || null,
        badge: opt.badge || null,
      };
    }
    return {
      value: opt,
      label: String(opt),
    };
  });

  // Selected Option
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Filtered options by search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Update floating position relative to trigger button
  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;

    const availableHeight = shouldOpenUpwards ? spaceAbove : spaceBelow;
    const calculatedMaxHeight = Math.min(280, Math.max(140, availableHeight - 16));

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));

    setMenuStyle({
      position: "fixed",
      left: `${left}px`,
      width: `${rect.width}px`,
      zIndex: 99999,
      ...(shouldOpenUpwards
        ? {
            bottom: `${window.innerHeight - rect.top + 4}px`,
            top: "auto",
          }
        : {
            top: `${rect.bottom + 4}px`,
            bottom: "auto",
          }),
      maxHeight: `${calculatedMaxHeight}px`,
    });
  }, []);

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      // Small timeout for DOM render in portal
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs min-h-[32px]",
    md: "py-2 px-3 text-xs min-h-[36px]",
  }[size];

  return (
    <div className={`relative flex flex-col ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold text-[#14213D] mb-1">
          {label} {required && <span className="text-[#B0403A]">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-[#FAFAF8] hover:bg-white border rounded-[8px] transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] focus:border-[#2F6F5E] shadow-2xs ${
          isOpen ? "border-[#2F6F5E] ring-2 ring-[#2F6F5E]/20 bg-white" : "border-[#E4E1D8]"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-[#EDEAE1]" : ""} ${sizeClasses}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {Icon && <Icon size={14} className="text-[#52607D] shrink-0" />}
          {selectedOption ? (
            <span className="font-medium text-[#14213D] truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-[#8C97AB] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && value !== "" && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-[#EDEAE1] text-[#8C97AB] hover:text-[#14213D] rounded-full transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#52607D] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#2F6F5E]" : ""
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu rendered via Portal */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-[#E4E1D8] rounded-[8px] shadow-[0_12px_32px_rgba(20,33,61,0.18)] py-1.5 overflow-hidden flex flex-col min-w-[200px]"
          >
            {/* Search Input */}
            {(searchable || normalizedOptions.length > 6) && (
              <div className="px-2.5 py-1.5 border-b border-[#EDEAE1] shrink-0 bg-[#FAFAF8]">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E] text-[#14213D] placeholder-[#8C97AB]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto flex-1 py-1 divide-y divide-transparent">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-[#8C97AB] text-center">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={`${String(opt.value)}_${idx}`}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3 py-2 text-xs flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#EAF3F0] text-[#2F6F5E] font-semibold"
                          : "text-[#14213D] hover:bg-[#FAFAF8] hover:text-[#2F6F5E]"
                      }`}
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.subtitle && (
                          <div className="text-[10px] text-[#52607D] font-normal truncate">
                            {opt.subtitle}
                          </div>
                        )}
                      </div>

                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FAFAF8] border border-[#EDEAE1] text-[#52607D] shrink-0 font-normal">
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && (
                        <Check size={14} className="text-[#2F6F5E] shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

      {error && <span className="text-[11px] text-[#B0403A] mt-1">{error}</span>}
    </div>
  );
}

export default CustomSelect;
