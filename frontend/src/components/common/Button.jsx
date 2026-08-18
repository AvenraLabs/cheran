import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-[8px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeClasses = {
    xs: "text-[11px] px-2 py-1 gap-1 font-semibold",
    sm: "text-xs px-2.5 py-1.5 gap-1.5 font-medium",
    md: "text-sm px-3.5 py-2 gap-2 font-medium",
    lg: "text-base px-5 py-2.5 gap-2.5 font-medium",
  }[size] || "text-xs px-2.5 py-1.5 gap-1.5 font-medium";

  const variantClasses = {
    primary:
      "bg-[#2F6F5E] text-white hover:bg-[#245749] focus:ring-[#2F6F5E] shadow-xs",
    secondary:
      "bg-white border border-[#E4E1D8] text-[#14213D] hover:bg-[#FAFAF8] hover:border-[#D3E6E0] focus:ring-[#2F6F5E] shadow-xs",
    danger:
      "bg-[#B0403A] text-white hover:bg-[#8F332E] focus:ring-[#B0403A] shadow-xs",
    ghost:
      "bg-transparent text-[#52607D] hover:text-[#14213D] hover:bg-[#EAF3F0] focus:ring-[#2F6F5E]",
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === "xs" ? 12 : size === "sm" ? 14 : 16} />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
