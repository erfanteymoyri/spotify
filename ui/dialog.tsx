"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Accessible label for the close icon button */
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Reusable modal built on the native <dialog> element */
export function Dialog({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
  footer,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keep the imperative <dialog> API in sync with the declarative `open` prop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "fixed inset-0 z-50 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/60 open:flex open:flex-col",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={closeLabel}
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
        {children}
      </div>
      {footer && <div className="border-t border-border px-5 py-4">{footer}</div>}
    </dialog>
  );
}
