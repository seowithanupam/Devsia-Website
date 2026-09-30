"use client";

import { useState } from "react";
import { TextField } from "@/components/ui";
import { useFieldError } from "./AdminForm";
import { MediaPicker, type MediaOption } from "./MediaPicker";

/** An image address field with the Media library picker. Submits under `name` like any other input. */
export function ImageField({ name, label, defaultValue = "", hint, media, altName }: { name: string; label: string; defaultValue?: string; hint?: string; media: MediaOption[]; altName?: string }) {
  const [value, setValue] = useState(defaultValue);
  const error = useFieldError(name);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <TextField name={name} label={label} hint={hint} value={value} onChange={(e) => setValue(e.target.value)} error={error} placeholder="/images/... or an uploaded image" />
      <MediaPicker
        options={media}
        onPick={(url, alt) => {
          setValue(url);
          if (altName && alt) {
            const el = document.querySelector<HTMLInputElement>(`input[name="${altName}"]`);
            if (el && !el.value) {
              // Fill the description box with the library's text, without overwriting what someone typed.
              const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
              setter?.call(el, alt);
              el.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }
        }}
      />
    </div>
  );
}
