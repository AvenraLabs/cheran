import React from "react";
import { Calendar } from "lucide-react";

/**
 * Cross-platform DateInput component.
 * Fixes mobile phone view where date inputs render as empty blank boxes without "dd-mm-yyyy".
 * Displays a clear placeholder (default "dd-mm-yyyy" or custom "From: dd-mm-yyyy") when empty,
 * while preserving native mobile picker and desktop calendar picker support.
 */
export default function DateInput({
  value,
  onChange,
  placeholder = "dd-mm-yyyy",
  className = "",
  wrapperClassName = "",
  icon = false,
  disabled = false,
  ...props
}) {
  const hasValue = Boolean(value);

  return (
    <div className={`relative inline-flex items-center w-full ${wrapperClassName}`}>
      {!hasValue && (
        <div className="absolute inset-y-0 left-0 pl-2.5 pr-8 flex items-center pointer-events-none select-none text-[#8C97AB] font-mono text-xs z-10 overflow-hidden text-ellipsis whitespace-nowrap">
          {icon && <Calendar size={13} className="mr-1.5 shrink-0 text-[#8C97AB]" />}
          <span>{placeholder}</span>
        </div>
      )}
      <input
        type="date"
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`w-full ${!hasValue ? "date-input-empty text-transparent focus:text-transparent" : "text-[#14213D]"} ${className}`}
        {...props}
      />
    </div>
  );
}
