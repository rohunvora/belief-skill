"use client";
import { useState } from "react";

export default function TrackButton({ thesisId }: { thesisId: string }) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  async function handleTrack() {
    setLoading(true);
    try {
      const res = await fetch(`/api/track?id=${thesisId}`);
      const data = await res.json();
      setOutput(data.output || "No tracking data available");
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleTrack}
        disabled={loading}
        style={{
          padding: "10px 20px",
          background: loading ? "#333" : "#6366f1",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
          marginBottom: 16,
        }}
      >
        {loading ? "Fetching prices..." : "📈 Track P&L"}
      </button>

      {output && (
        <pre style={{
          padding: 16,
          background: "#0a0a0f",
          borderRadius: 8,
          fontSize: 12,
          color: "#a1a1aa",
          whiteSpace: "pre-wrap",
          overflowX: "auto",
          lineHeight: 1.6,
        }}>
          {output}
        </pre>
      )}
    </div>
  );
}
