import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  searchable = true,
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
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options array to { value, label }
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
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filtered options by search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine whether to open upwards or downwards based on viewport space
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 260 && rect.top > 260) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
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
          {value && value !== "" && !disabled && (
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

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-[999] bg-white border border-[#E4E1D8] rounded-[8px] shadow-[0_8px_24px_rgba(20,33,61,0.12)] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[200px] ${
            openUpwards ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {/* Search Input for > 6 options */}
          {(searchable || normalizedOptions.length > 6) && (
            <div className="px-2 pb-1.5 border-b border-[#EDEAE1]">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E] text-[#14213D]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#8C97AB] text-center">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
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
        </div>
      )}

      {error && <span className="text-[11px] text-[#B0403A] mt-1">{error}</span>}
    </div>
  );
}

export default CustomSelect;
