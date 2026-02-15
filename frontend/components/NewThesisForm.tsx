"use client";
import { useState } from "react";

export default function NewThesisForm() {
  const [thesis, setThesis] = useState("");
  const [budget, setBudget] = useState("20000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!thesis.trim()) return;
    
    setLoading(true);
    setResult("");
    
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thesis: thesis.trim(), budget: parseInt(budget) }),
      });
      const data = await res.json();
      
      if (data.error) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(data.output);
        // Reload to show new card
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: "#111118",
      borderRadius: 12,
      padding: 20,
      marginBottom: 32,
      border: "1px solid #222",
    }}>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={thesis}
          onChange={e => setThesis(e.target.value)}
          placeholder='Enter a thesis... e.g. "AI will replace 50% of coding jobs"'
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#0a0a0f",
            border: "1px solid #333",
            borderRadius: 8,
            color: "#e4e4e7",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Budget</label>
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            style={{
              width: 120,
              padding: "8px 12px",
              background: "#0a0a0f",
              border: "1px solid #333",
              borderRadius: 6,
              color: "#e4e4e7",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !thesis.trim()}
          style={{
            marginTop: 16,
            padding: "10px 24px",
            background: loading ? "#333" : "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: !thesis.trim() ? 0.5 : 1,
          }}
        >
          {loading ? "Routing..." : "🧠 Route Thesis"}
        </button>
      </div>

      {result && (
        <pre style={{
          marginTop: 16,
          padding: 16,
          background: "#0a0a0f",
          borderRadius: 8,
          fontSize: 12,
          color: "#a1a1aa",
          whiteSpace: "pre-wrap",
          overflowX: "auto",
          maxHeight: 300,
        }}>
          {result}
        </pre>
      )}
    </form>
  );
}
