"use client";
import { useState } from "react";
export function ImageClaim({ onExtract }: { onExtract: (claim: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const extract = async (file?: File) => {
    if (!file || busy) return;
    setError("");
    if (file.size > 8 * 1024 * 1024) { setError("Choose an image smaller than 8 MB."); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.set("image", file);
      const response = await fetch("/api/claim", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not read image");
      onExtract(result.claim);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read image"); }
    finally { setBusy(false); }
  };
  return <div className="mt-4 text-sm text-ink-soft" tabIndex={0} onPaste={event => {
    const file = Array.from(event.clipboardData.files).find(file => file.type.startsWith("image/"));
    if (file) { event.preventDefault(); void extract(file); }
  }}>
    <label className="mr-4">Upload screenshot <input aria-label="Upload claim image" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { void extract(e.target.files?.[0]); e.target.value = ""; }} /></label>
    <label>Take photo <input aria-label="Photograph claim" type="file" accept="image/*" capture="environment" disabled={busy} onChange={e => { void extract(e.target.files?.[0]); e.target.value = ""; }} /></label>
    <p className="mt-2">{busy ? "Reading image…" : "Or paste an image here. Review the extracted text above, then press Trace."}</p>
    {error && <p role="alert" className="text-removed">{error}</p>}
  </div>;
}
