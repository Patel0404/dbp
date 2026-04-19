"use client";

import { useState } from "react";
import type { IntegrationCatalogEntry, IntegrationRecord } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function IntegrationForm({
  entry,
  record,
}: {
  entry: IntegrationCatalogEntry;
  record: IntegrationRecord | null;
}) {
  const [enabled, setEnabled] = useState(record?.enabled ?? false);
  const [credentials, setCredentials] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const f of entry.fields) seed[f.name] = record?.credentials[f.name] ?? "";
    return seed;
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "saved" }
    | { kind: "tested"; ok: boolean; error?: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [expanded, setExpanded] = useState(false);

  const statusChip = (() => {
    if (status.kind === "saved") return { label: "Saved", tone: "chip-pos" };
    if (status.kind === "tested") return status.ok ? { label: "Connected", tone: "chip-pos" } : { label: "Failed", tone: "chip-neg" };
    if (record?.lastTestOk) return { label: "Connected", tone: "chip-pos" };
    if (record?.lastTestOk === false) return { label: "Last test failed", tone: "chip-neg" };
    if (record) return { label: "Saved", tone: "chip" };
    return { label: "Not configured", tone: "chip" };
  })();

  async function save() {
    setSaving(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch(`${API_URL}/v1/admin/integrations/${entry.key}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled, credentials }),
      });
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      setStatus({ kind: "saved" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch(`${API_URL}/v1/admin/integrations/${entry.key}/test`, {
        method: "POST",
      });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      setStatus({ kind: "tested", ok: payload.ok, error: payload.error });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "test failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="card p-4">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-sm">{entry.displayName}</h2>
            <span className={`chip ${statusChip.tone}`}>{statusChip.label}</span>
            {entry.supportsRealMoney ? (
              <span className="chip chip-pos">Real API</span>
            ) : (
              <span className="chip chip-warn">Manual / deep-link</span>
            )}
          </div>
          <p className="muted text-[12px] mt-1">{entry.description}</p>
        </div>
        <span className="ml-2 text-sm secondary">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {entry.setupUrl && (
            <a
              href={entry.setupUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-[12px] text-brand-500 underline"
            >
              Get credentials →
            </a>
          )}

          {entry.fields.length === 0 ? (
            <p className="secondary text-[13px]">No credentials needed. Toggle enabled to use the deep-link flow.</p>
          ) : (
            entry.fields.map((field) => (
              <label key={field.name} className="block">
                <span className="text-[12px] secondary">{field.label}{field.required ? " *" : ""}</span>
                {field.type === "textarea" ? (
                  <textarea
                    className="mt-1 w-full rounded-lg bg-[#0d1530] border border-[#1c2540] px-3 py-2 text-sm"
                    placeholder={field.placeholder}
                    value={credentials[field.name] ?? ""}
                    onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                    rows={4}
                    autoComplete="off"
                    spellCheck={false}
                  />
                ) : (
                  <input
                    type={field.type === "password" ? "password" : "text"}
                    className="mt-1 w-full rounded-lg bg-[#0d1530] border border-[#1c2540] px-3 py-2 text-sm"
                    placeholder={field.placeholder}
                    value={credentials[field.name] ?? ""}
                    onChange={(e) => setCredentials({ ...credentials, [field.name]: e.target.value })}
                    autoComplete="off"
                    spellCheck={false}
                  />
                )}
                {field.help && <span className="muted text-[11px] block mt-1">{field.help}</span>}
              </label>
            ))
          )}

          <label className="flex items-center gap-2 text-sm pt-1">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-brand-500"
            />
            Enable this integration
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-brand-500 font-semibold text-sm disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={test}
              disabled={testing || !record}
              className="px-4 py-2 rounded-xl border border-[#1c2540] text-sm disabled:opacity-50"
            >
              {testing ? "Testing…" : "Test connection"}
            </button>
          </div>

          {status.kind === "saved" && (
            <p className="text-pos text-[12px]">Saved. Tap "Test connection" to verify.</p>
          )}
          {status.kind === "tested" && status.ok && (
            <p className="text-pos text-[12px]">✓ Connected.</p>
          )}
          {status.kind === "tested" && !status.ok && (
            <p className="text-neg text-[12px]">✗ {status.error ?? "connection failed"}</p>
          )}
          {status.kind === "error" && (
            <p className="text-neg text-[12px]">{status.message}</p>
          )}
        </div>
      )}
    </section>
  );
}
