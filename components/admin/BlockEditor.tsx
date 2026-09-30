"use client";

import { useState } from "react";
import { Button, SelectField, TextAreaField, TextField } from "@/components/ui";
import { BLOCK_DEFS, PAGE_DEFS, type BlockData, type BlockType, type FieldDef, type PageSlug } from "@/lib/cms/blocks";
import { cn } from "@/lib/cn";
import { AdminForm, useFieldError } from "./AdminForm";
import { MediaOptionsContext, MediaPicker, type MediaOption } from "./MediaPicker";
import styles from "./admin.module.css";
import type { ActionState } from "@/lib/admin/action-state";

type ServerAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;
export type EditorBlock = { type: BlockType; enabled: boolean; data: BlockData };

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asRecord = (v: unknown): Record<string, unknown> => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const asString = (v: unknown): string => (typeof v === "string" ? v : "");

function blankFor(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.kind === "list" || f.kind === "lines" || f.kind === "paragraphs") out[f.key] = [];
    else if (f.kind === "group") out[f.key] = blankFor(f.fields);
    else if (f.kind === "select") out[f.key] = f.options[0]?.value ?? "";
    else out[f.key] = "";
  }
  return out;
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** One field, of any kind. `path` matches the dotted error keys the server returns ("blocks.2.points.1.title"). */
function FieldInput({ def, value, onChange, path }: { def: FieldDef; value: unknown; onChange: (next: unknown) => void; path: string }) {
  const error = useFieldError(path);
  switch (def.kind) {
    case "text":
      return <TextField label={def.label} hint={def.hint} required={def.required} maxLength={def.max ?? 200} value={asString(value)} onChange={(e) => onChange(e.target.value)} error={error} />;
    case "textarea":
      return <TextAreaField label={def.label} hint={def.hint} required={def.required} rows={def.rows ?? 4} maxLength={def.max ?? 2000} value={asString(value)} onChange={(e) => onChange(e.target.value)} error={error} />;
    case "lines":
      return <TextAreaField label={def.label} hint={def.hint} rows={5} value={asArray(value).map(asString).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} error={error} />;
    case "paragraphs":
      return <TextAreaField label={def.label} hint={def.hint} rows={9} value={asArray(value).map(asString).join("\n\n")} onChange={(e) => onChange(e.target.value.split(/\n{2,}/))} error={error} />;
    case "link":
      return <TextField label={def.label} hint={def.hint} required={def.required} value={asString(value)} onChange={(e) => onChange(e.target.value)} error={error} />;
    case "image":
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <TextField label={def.label} hint={def.hint} required={def.required} value={asString(value)} onChange={(e) => onChange(e.target.value)} error={error} />
          <MediaPicker onPick={(url) => onChange(url)} />
        </div>
      );
    case "select":
      return (
        <SelectField label={def.label} value={asString(value)} onChange={(e) => onChange(e.target.value)} error={error}>
          {def.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      );
    case "group": {
      const record = asRecord(value);
      return (
        <div className={styles.groupBox}>
          <p className={styles.groupTitle}>{def.label}</p>
          {def.fields.map((f) => (
            <FieldInput key={f.key} def={f} value={record[f.key]} path={`${path}.${f.key}`} onChange={(next) => onChange({ ...record, [f.key]: next })} />
          ))}
        </div>
      );
    }
    case "list": {
      const items = asArray(value).map(asRecord);
      return (
        <div style={{ display: "grid", gap: 10 }}>
          <p className={styles.groupTitle}>{def.label}</p>
          {error ? (
            <p role="alert" style={{ color: "var(--color-red)", fontSize: 13, margin: 0 }}>
              {error}
            </p>
          ) : null}
          {items.map((item, index) => (
            <div key={index} className={styles.listItem}>
              <div className={styles.listItemHead}>
                <span>
                  {def.itemLabel} {index + 1}
                </span>
                <span className={styles.actions}>
                  <button type="button" className={styles.iconBtn} aria-label={`Move ${def.itemLabel} ${index + 1} up`} disabled={index === 0} onClick={() => onChange(move(items, index, index - 1))}>
                    ↑
                  </button>
                  <button type="button" className={styles.iconBtn} aria-label={`Move ${def.itemLabel} ${index + 1} down`} disabled={index === items.length - 1} onClick={() => onChange(move(items, index, index + 1))}>
                    ↓
                  </button>
                  <button type="button" className={cn(styles.iconBtn, styles.dangerBtn)} aria-label={`Remove ${def.itemLabel} ${index + 1}`} disabled={def.min !== undefined && items.length <= def.min} onClick={() => onChange(items.filter((_, i) => i !== index))}>
                    Remove
                  </button>
                </span>
              </div>
              {def.fields.map((f) => (
                <FieldInput key={f.key} def={f} value={item[f.key]} path={`${path}.${index}.${f.key}`} onChange={(next) => onChange(items.map((it, i) => (i === index ? { ...it, [f.key]: next } : it)))} />
              ))}
            </div>
          ))}
          {items.length < def.max ? (
            <div>
              <Button variant="outline" size="sm" onClick={() => onChange([...items, blankFor(def.fields)])}>
                Add {def.itemLabel.toLowerCase()}
              </Button>
            </div>
          ) : null}
        </div>
      );
    }
  }
}

/**
 * Block-by-block page editor: change each block's text, hide or show it, reorder, add or remove optional
 * blocks. Required blocks cannot be hidden or removed. The whole page is sent as one JSON field and is
 * checked again field by field on the server.
 */
export function BlockEditor({ slug, initial, action, media }: { slug: PageSlug; initial: EditorBlock[]; action: ServerAction; media: MediaOption[] }) {
  const def = PAGE_DEFS[slug];
  const [blocks, setBlocks] = useState<EditorBlock[]>(initial);
  const present = new Set(blocks.map((b) => b.type));
  const addable = def.allowed.filter((t) => !present.has(t));
  const [toAdd, setToAdd] = useState<string>("");

  const payload = JSON.stringify(blocks.map((b) => ({ type: b.type, enabled: b.enabled, data: b.data })));

  return (
    <MediaOptionsContext.Provider value={media}>
      <AdminForm action={action} submitLabel="Save page">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="blocks" value={payload} />
        <BlockList blocks={blocks} setBlocks={setBlocks} required={def.required} />
        {addable.length > 0 ? (
          <div className={styles.toolbar}>
            <div className={styles.grow}>
              <SelectField label="Add a block" value={toAdd} onChange={(e) => setToAdd(e.target.value)}>
                <option value="">Choose a block…</option>
                {addable.map((t) => (
                  <option key={t} value={t}>
                    {BLOCK_DEFS[t].label}
                  </option>
                ))}
              </SelectField>
            </div>
            <Button
              variant="outline"
              disabled={!toAdd}
              onClick={() => {
                const type = toAdd as BlockType;
                setBlocks([...blocks, { type, enabled: true, data: BLOCK_DEFS[type].defaults() }]);
                setToAdd("");
              }}
            >
              Add block
            </Button>
          </div>
        ) : null}
      </AdminForm>
    </MediaOptionsContext.Provider>
  );
}

function BlockList({ blocks, setBlocks, required }: { blocks: EditorBlock[]; setBlocks: (b: EditorBlock[]) => void; required: BlockType[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const formError = useFieldError("_form");
  return (
    <>
      {formError ? (
        <p role="alert" className={`${styles.notice} ${styles.noticeError}`}>
          {formError}
        </p>
      ) : null}
      {blocks.map((block, index) => {
        const bdef = BLOCK_DEFS[block.type];
        const isRequired = required.includes(block.type);
        const open = openIndex === index;
        return (
          <section key={block.type} className={cn(styles.block, !block.enabled && styles.blockHidden)} aria-label={bdef.label}>
            <div className={styles.blockHead}>
              <h2 className={styles.blockTitle}>
                {bdef.label}
                {!block.enabled ? " (hidden)" : ""}
              </h2>
              <button type="button" className={styles.iconBtn} aria-expanded={open} onClick={() => setOpenIndex(open ? null : index)}>
                {open ? "Collapse" : "Edit"}
              </button>
              <button type="button" className={styles.iconBtn} aria-label={`Move ${bdef.label} up`} disabled={index === 0} onClick={() => setBlocks(move(blocks, index, index - 1))}>
                ↑
              </button>
              <button type="button" className={styles.iconBtn} aria-label={`Move ${bdef.label} down`} disabled={index === blocks.length - 1} onClick={() => setBlocks(move(blocks, index, index + 1))}>
                ↓
              </button>
              <button type="button" className={styles.iconBtn} disabled={isRequired} title={isRequired ? "Required block" : undefined} onClick={() => setBlocks(blocks.map((b, i) => (i === index ? { ...b, enabled: !b.enabled } : b)))}>
                {block.enabled ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                className={cn(styles.iconBtn, styles.dangerBtn)}
                disabled={isRequired}
                title={isRequired ? "Required block" : undefined}
                onClick={() => {
                  if (window.confirm(`Remove the ${bdef.label} block from this page? You can add it back later.`)) setBlocks(blocks.filter((_, i) => i !== index));
                }}
              >
                Remove
              </button>
            </div>
            {open ? (
              <div className={styles.blockBody}>
                <p className={styles.hintLine}>{bdef.help}</p>
                {bdef.fields.map((f) => (
                  <FieldInput
                    key={f.key}
                    def={f}
                    value={block.data[f.key]}
                    path={`blocks.${index}.${f.key}`}
                    onChange={(next) => setBlocks(blocks.map((b, i) => (i === index ? { ...b, data: { ...b.data, [f.key]: next } } : b)))}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
