"use client";

/**
 * Button that triggers the browser's print dialog (used to "export" the
 * print-styled advisor brief / ledgers as PDF). Client-only — needs `window`.
 *
 * @module components/app/print-button
 */
import { Download } from "lucide-react";

/**
 * @param props.label - Button text (default `"Download PDF"`).
 * @param props.className - Extra classes appended to the button.
 * @returns A print-trigger button.
 */
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
