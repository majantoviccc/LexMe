"use client";

import { Dialog } from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Potvrdi akciju",
  message,
  confirmLabel = "Potvrdi",
  cancelLabel = "Otkazi",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={message}>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          className={cn(
            destructive && "bg-red-500 text-white hover:bg-red-600"
          )}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
