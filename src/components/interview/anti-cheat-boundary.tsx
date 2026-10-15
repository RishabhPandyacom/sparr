"use client";

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

/**
 * Soft anti-cheat for interview screens: blocks paste and the context menu
 * while mounted, and cleans up on unmount so the rest of the app (e.g. pasting
 * a JD into the cover-letter tool) is unaffected. This is a deterrent, not
 * DRM — a determined user can still bypass it.
 */
export function AntiCheatBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Pasting is disabled during interviews.");
    };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("paste", onPaste, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("copy", onCopy, true);
    return () => {
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("copy", onCopy, true);
    };
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <ShieldAlert className="size-4 shrink-0" />
        Proctored mode: copy, paste, and right-click are disabled to keep it fair.
      </div>
      {children}
    </div>
  );
}
