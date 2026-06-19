"use client";

import { Download } from "lucide-react";

export function PrintButton({
  label = "Download PDF",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 h-10 text-sm font-medium hover:bg-foreground/90 transition-colors ${className}`}
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  );
}
