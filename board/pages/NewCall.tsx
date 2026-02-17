import React, { useState } from "react";

type Direction = "long" | "short";

interface FormState {
  thesis: string;
  ticker: string;
  direction: Direction;
  entryPrice: string;
  breakeven: string;
  kills: string;
  sourceUrl: string;
}

const initial: FormState = {
  thesis: "",
  ticker: "",
  direction: "long",
  entryPrice: "",
  breakeven: "",
  kills: "",
  sourceUrl: "",
};

export function NewCall() {
  const [form, setForm] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, boolean>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const handleSubmit = () => {
    const required: (keyof FormState)[] = [
      "thesis",
      "ticker",
      "entryPrice",
      "breakeven",
      "kills",
    ];
    const next: Partial<Record<keyof FormState, boolean>> = {};
    let hasError = false;
    for (const key of required) {
      if (!form[key].trim()) {
        next[key] = true;
        hasError = true;
      }
    }
    if (hasError) {
      setErrors(next);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">&#10003;</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Call posted
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Your call on <span className="font-medium">{form.ticker.toUpperCase()}</span> is live.
          The board will track it automatically.
        </p>
        <button
          onClick={() => {
            setForm(initial);
            setSubmitted(false);
            setErrors({});
          }}
          className="text-sm text-green-600 hover:underline mr-4"
        >
          Post another
        </button>
        <a
          href="#/"
          className="text-sm text-gray-500 hover:underline"
        >
          Back to feed
        </a>
      </div>
    );
  }

  const fieldBorder = (key: keyof FormState) =>
    errors[key]
      ? "border-red-400 ring-1 ring-red-200"
      : "border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent";

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Make Your Call</h1>
        <p className="text-sm text-gray-500">6 fields. That's it.</p>
      </div>

      <div className="space-y-5">
        {/* 1. Thesis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thesis
          </label>
          <textarea
            rows={3}
            placeholder="What do you believe?"
            value={form.thesis}
            onChange={(e) => set("thesis", e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none ${fieldBorder("thesis")}`}
          />
          {errors.thesis && (
            <p className="text-xs text-red-500 mt-1">Required</p>
          )}
        </div>

        {/* 2. Ticker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ticker
          </label>
          <input
            type="text"
            placeholder="GOOG, LAES, Kalshi slug..."
            value={form.ticker}
            onChange={(e) => set("ticker", e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none ${fieldBorder("ticker")}`}
          />
          {errors.ticker && (
            <p className="text-xs text-red-500 mt-1">Required</p>
          )}
        </div>

        {/* 3. Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Direction
          </label>
          <div className="flex gap-0">
            <button
              type="button"
              onClick={() => set("direction", "long")}
              className={`flex-1 py-2 text-sm font-medium rounded-l-md border transition-colors ${
                form.direction === "long"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => set("direction", "short")}
              className={`flex-1 py-2 text-sm font-medium rounded-r-md border-t border-b border-r transition-colors ${
                form.direction === "short"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Short
            </button>
          </div>
        </div>

        {/* 4. Entry Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entry Price
          </label>
          <input
            type="number"
            step="any"
            placeholder="Current price"
            value={form.entryPrice}
            onChange={(e) => set("entryPrice", e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none ${fieldBorder("entryPrice")}`}
          />
          {errors.entryPrice && (
            <p className="text-xs text-red-500 mt-1">Required</p>
          )}
        </div>

        {/* 5. Breakeven */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Breakeven
          </label>
          <input
            type="text"
            placeholder="X% to be +EV"
            value={form.breakeven}
            onChange={(e) => set("breakeven", e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none ${fieldBorder("breakeven")}`}
          />
          {errors.breakeven && (
            <p className="text-xs text-red-500 mt-1">Required</p>
          )}
        </div>

        {/* 6. Dies if */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dies if
          </label>
          <textarea
            rows={2}
            placeholder="What kills this trade?"
            value={form.kills}
            onChange={(e) => set("kills", e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-md bg-white focus:outline-none ${fieldBorder("kills")}`}
          />
          {errors.kills && (
            <p className="text-xs text-red-500 mt-1">Required</p>
          )}
        </div>

        {/* Optional: Source URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source URL{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="Link to original tweet, article, or post"
            value={form.sourceUrl}
            onChange={(e) => set("sourceUrl", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          Post Call
        </button>

        <p className="text-xs text-gray-400 text-center">
          Once posted, you can't delete it. The board tracks it automatically.
        </p>
      </div>
    </div>
  );
}
