"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title = "Unesite vrijednost",
  description,
  placeholder,
  defaultValue = "",
  submitLabel = "Potvrdi",
  cancelLabel = "Otkazi",
  onSubmit,
  onCancel,
}: Props) {
  const [value, setValue] = useState(defaultValue);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setValue(defaultValue);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={!value.trim()}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
