"use client";
import { useState } from "react";
export function ParagraphStory({ title, hash }: { title: string; hash: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <section className="border-t border-rule pt-4">
    <button type="button" disabled={busy} className="text-rubric underline disabled:opacity-50" onClick={async () => {
      setBusy(true); setError("");
      try {
        const response = await fetch(`/api/article/${encodeURIComponent(title)}/claim/${hash}/story`, { method: "POST" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Story failed");
        setText(result.text);
      } catch(e) { setError(e instanceof Error ? e.message : "Story failed"); }
      finally { setBusy(false); }
    }}>{busy ? "Reading every wording…" : "Explain how this paragraph changed"}</button>
    {text && <><p className="mt-2 text-xs text-ink-faint">Gemini interpretation of the complete linked wording history. Verify against the wordings below.</p><p className="mt-3 whitespace-pre-wrap font-serif">{text}</p></>}
    {error && <p role="alert" className="text-removed">{error}</p>}
  </section>;
}
