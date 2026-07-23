"use client";

import { toast } from "sonner";
import { Button } from "@/ui/button";

export { toast };

interface ConfirmToastOptions {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Style the confirm action as destructive (delete flows) */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Inline confirmation rendered as a toast instead of the native
 * window.confirm() dialog. Resolves when the user picks an action.
 */
export function confirmToast({
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: ConfirmToastOptions) {
  toast.custom(
    (id) => (
      <div className="flex w-full flex-col gap-3 rounded-xl border border-border bg-popover p-4 shadow-lg">
        <div>
          <p className="font-medium">{title}</p>
          {description && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => toast.dismiss(id)}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={() => {
              toast.dismiss(id);
              void onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    ),
    { duration: Infinity },
  );
}
