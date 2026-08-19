import React from "react";

export function StatusBadge({ status, size = "md" }) {
  if (!status) return null;

  const s = String(status).toLowerCase();

  let style = "bg-[#EAF3F0] text-[#2F6F5E] border-[#D3E6E0]"; // Default green/teal
  let dotColor = "bg-[#2F6F5E]";

  if (s.includes("revert") || s.includes("reject") || s.includes("error") || s.includes("fail")) {
    style = "bg-[#FDF2F1] text-[#B0403A] border-[#F8D7D5]";
    dotColor = "bg-[#B0403A]";
  } else if (
    s.includes("pending") ||
    s.includes("received") ||
    s.includes("recommended") ||
    s.includes("verification") ||
    s.includes("progress") ||
    s.includes("preview") ||
    s.includes("resolution")
  ) {
    style = "bg-[#FDF8EC] text-[#B8860B] border-[#F7E7C4]";
    dotColor = "bg-[#B8860B]";
  } else if (s.includes("credited") || s.includes("approved") || s.includes("completed") || s.includes("issued")) {
    style = "bg-[#EAF3F0] text-[#2F6F5E] border-[#D3E6E0]";
    dotColor = "bg-[#2F6F5E]";
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style} ${sizeClasses} max-w-full leading-snug shadow-xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <span className="break-words">{status}</span>
    </span>
  );
}

export default StatusBadge;
