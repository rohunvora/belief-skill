import React, { useMemo, useState } from "react";
import type { Call, PriceLadderStep, DerivationStep, Segment } from "../types";
import { extractDerivationDetail, extractChainDisplay } from "../types";
import { Avatar } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { useCallDetail } from "../hooks/useCallDetail";
import { timeAgo, formatPrice, computePnl } from "../utils";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Asymmetry bar — replaces price ladder. Shows risk/reward as a horizontal bar. */
function AsymmetryBar({
  steps,
  entryPrice,
  currentPrice,
  direction,
}: {
  steps: PriceLadderStep[];
  entryPrice: number;
  currentPrice?: number;
  direction: "long" | "short";
}) {
  if (steps.length < 2) return null;

  const sorted = [...steps].sort((a, b) => a.pnl_pct - b.pnl_pct);
  const worst = sorted[0]; // most negative pnl_pct
  const best = sorted[sorted.length - 1]; // most positive pnl_pct

  // Need both upside and downside to show the bar
  if (worst.pnl_pct >= 0 || best.pnl_pct <= 0) return null;

  const totalRange = best.pnl_pct - worst.pnl_pct;
  const downsidePct = Math.abs(worst.pnl_pct);
  const upsidePct = best.pnl_pct;

  // Current position as percentage along the bar (0 = worst, 100 = best)
  const currentPnl = currentPrice
    ? computePnl(entryPrice, currentPrice, direction)
    : 0;
  const markerPos = ((currentPnl - worst.pnl_pct) / totalRange) * 100;
  const clampedPos = Math.max(2, Math.min(98, markerPos));

  // Asymmetry ratio
  const ratio = downsidePct > 0 ? (upsidePct / downsidePct) : null;

  // Zero line position (entry point)
  const zeroPos = ((0 - worst.pnl_pct) / totalRange) * 100;

  return (
    <div className="py-3">
      {/* Labels above */}
      <div className="flex justify-between text-[11px] mb-2">
        <span className="text-red-500 max-w-[45%] truncate">
          ▼ {worst.pnl_pct}% {worst.label}
        </span>
        <span className="text-green-600 max-w-[45%] truncate text-right">
          ▲ +{best.pnl_pct}% {best.label}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-gray-100">
        {/* Red zone (left of zero) */}
        <div
          className="absolute inset-y-0 left-0 bg-red-100 rounded-l-full"
          style={{ width: `${zeroPos}%` }}
        />
        {/* Green zone (right of zero) */}
        <div
          className="absolute inset-y-0 right-0 bg-green-100 rounded-r-full"
          style={{ width: `${100 - zeroPos}%` }}
        />
        {/* Zero line (entry) */}
        <div
          className="absolute inset-y-0 w-px bg-gray-300"
          style={{ left: `${zeroPos}%` }}
        />
        {/* Current position marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${
            currentPnl >= 0 ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ left: `${clampedPos}%`, marginLeft: "-5px" }}
        />
      </div>

      {/* Marker label + asymmetry ratio */}
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-[11px] text-gray-400">
          {currentPrice
            ? `● here (${currentPnl >= 0 ? "+" : ""}${currentPnl.toFixed(1)}%)`
            : `● entry`
          }
        </span>
        {ratio != null && ratio > 1 && (
          <span className="text-[11px] text-green-600 font-medium">
            {ratio.toFixed(1)}x more upside
          </span>
        )}
        {ratio != null && ratio < 1 && (
          <span className="text-[11px] text-red-500 font-medium">
            {(1 / ratio).toFixed(1)}x more downside
          </span>
        )}
      </div>
    </div>
  );
}

/** Collapsible reasoning section */
function ReasoningSection({ call }: { call: Call }) {
  const [expanded, setExpanded] = useState(false);

  const detail = extractDerivationDetail(call);
  const chain = extractChainDisplay(call);

  // Check if we have any reasoning content
  const hasDetailedSteps = detail && detail.steps.length > 0;
  const hasChainSteps = chain.hasChain && chain.steps.length > 0;
  const hasReasoning = call.reasoning;

  if (!hasDetailedSteps && !hasChainSteps && !hasReasoning) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[13px] text-gray-400 hover:text-gray-600 active:text-gray-700 flex items-center gap-1"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {expanded ? "Hide reasoning" : "Show reasoning"}
      </button>

      {expanded && (
        <div className="mt-2 pl-3 border-l border-gray-100 space-y-1.5">
          {/* Detailed steps with segment references */}
          {hasDetailedSteps && detail!.steps.map((step: DerivationStep, i: number) => {
            const seg: Segment | null = step.segment !== undefined ? (detail!.segments[step.segment] ?? null) : null;
            return (
              <div key={i} className="text-[13px] text-gray-600 leading-relaxed">
                <span className="text-gray-400 mr-1.5">{i + 1}.</span>
                {step.text}
                {seg && (
                  <span className="text-[11px] text-gray-400 ml-1.5">
                    — {seg.speaker}{seg.timestamp ? ` @ ${seg.timestamp}` : ""}
                  </span>
                )}
              </div>
            );
          })}

          {/* Simple chain steps (no segment data) */}
          {!hasDetailedSteps && hasChainSteps && chain.steps.map((step: string, i: number) => (
            <div key={i} className="text-[13px] text-gray-600 leading-relaxed">
              <span className="text-gray-400 mr-1.5">{i + 1}.</span>
              {step}
            </div>
          ))}

          {/* Plain reasoning text */}
          {!hasDetailedSteps && !hasChainSteps && hasReasoning && (
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {call.reasoning}
            </p>
          )}

          {/* Chose over */}
          {(detail?.chose_over || chain.chose_over) && (
            <p className="text-[12px] text-gray-500 pt-1.5 border-t border-gray-100">
              Instead of: {detail?.chose_over || chain.chose_over}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CardDetail({ id }: { id: string }) {
  const { call, loading } = useCallDetail(id);
  const [linkCopied, setLinkCopied] = useState(false);

  const singleCallArray = useMemo(() => call ? [call] : [], [call?.id]);
  const livePrices = useLivePrices(singleCallArray);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center text-gray-500 py-8">
        Loading...
      </div>
    );
  }

  if (!call) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Call not found
        </h2>
        <a
          href="#/"
          className="min-h-[44px] inline-flex items-center text-gray-600 hover:text-gray-900 active:text-gray-900 text-sm font-medium"
        >
          &larr; Back to feed
        </a>
      </div>
    );
  }

  const callerHandle = call.caller_handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;
  const displayAvatarUrl = call.source_handle ? call.author_avatar_url : call.caller_avatar_url;

  const livePrice = livePrices.get(call.id);

  const pnl = livePrice
    ? computePnl(call.entry_price, livePrice.currentPrice, call.direction)
    : null;

  const isLong = call.direction === "long";

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/call/${call.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-0">
      <a
        href="#/"
        className="min-h-[44px] inline-flex items-center text-sm text-gray-500 hover:text-gray-700 active:text-gray-900 mb-3"
      >
        &larr; Feed
      </a>

      <article className="bg-white rounded-lg border border-gray-200 p-5">

        {/* A. Ticker Header */}
        <div className="flex items-baseline justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">{call.ticker}</span>
            <span className={`text-sm font-semibold ${isLong ? "text-green-600" : "text-red-600"}`}>
              {isLong ? "▲ Long" : "▼ Short"}
            </span>
            <span className="text-sm text-gray-400">
              · {formatPrice(call.entry_price)}
            </span>
          </div>
          {pnl != null && (
            <span
              className={`text-2xl font-extrabold tabular-nums tracking-tight ${
                pnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {pnl >= 0 ? "+" : ""}{pnl.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Subtitle: live price + dollar change */}
        {livePrice && (
          <p className="text-sm text-gray-500 mb-4">
            Now {formatPrice(livePrice.currentPrice)}
            <span className="text-gray-300 mx-1">·</span>
            <span className={pnl != null && pnl >= 0 ? "text-green-600" : "text-red-600"}>
              {livePrice.changeDollars >= 0 ? "+" : ""}
              {formatPrice(Math.abs(livePrice.changeDollars))} from entry
            </span>
          </p>
        )}
        {!livePrice && <div className="mb-4" />}

        {/* B. Headline quote — the human signal (hero) */}
        {(call.headline_quote || call.source_quote) && (
          <div className="border-l-2 border-gray-300 pl-3 mb-4">
            <p className="text-base font-medium text-gray-900 leading-snug">
              &ldquo;{call.headline_quote || call.source_quote}&rdquo;
            </p>
            <p className="text-[12px] text-gray-500 mt-1.5">
              — @{displayHandle}
              {call.source_date && `, ${formatDate(call.source_date)}`}
              {call.source_url && (
                <a
                  href={call.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 text-gray-400 hover:text-gray-600 hover:underline"
                >
                  View original →
                </a>
              )}
            </p>
            {call.scan_source && (
              <p className="text-[11px] text-gray-400 mt-1">
                via {call.scan_source}
              </p>
            )}
          </div>
        )}

        {/* C. Full source quote (if longer than headline — show the evidence) */}
        {call.source_quote && call.headline_quote && call.source_quote !== call.headline_quote && (
          <div className="border-l-2 border-gray-100 pl-3 mb-4">
            <p className="text-[14px] text-gray-600 italic leading-relaxed">
              &ldquo;{call.source_quote}&rdquo;
            </p>
          </div>
        )}

        {/* D. Edge — AI's sharpest reframe */}
        {call.edge && (
          <p className="text-[15px] text-gray-700 leading-relaxed mb-4">
            {call.edge}
          </p>
        )}

        {/* E. Thesis — AI's full argument (only if different from edge) */}
        {call.thesis && call.thesis !== call.edge && (
          <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
            {call.thesis}
          </p>
        )}

        {/* F. Asymmetry Bar */}
        {call.price_ladder && call.price_ladder.length >= 2 && (
          <div className="border border-gray-100 rounded-md px-4 py-1 mb-4 bg-gray-50/50">
            <AsymmetryBar
              steps={call.price_ladder}
              entryPrice={call.entry_price}
              currentPrice={livePrice?.currentPrice}
              direction={call.direction}
            />
          </div>
        )}

        {/* F. Reasoning (collapsible) */}
        <ReasoningSection call={call} />

        {/* G. Counter + Alternative + Kills */}
        {call.counter && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Against this:</span> {call.counter}
          </p>
        )}

        {call.alternative && (
          <div className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-600 mb-2">
            <span className="font-medium">Chosen over:</span> {call.alternative}
          </div>
        )}

        {call.kills && (
          <p className="text-xs text-gray-500 mb-3">
            <span className="text-red-500 font-medium">Dies if:</span> {call.kills}
          </p>
        )}

        {/* H. Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Avatar handle={displayHandle} avatarUrl={displayAvatarUrl} size="sm" />
            <span>@{displayHandle}</span>
            {call.source_handle && call.source_handle !== callerHandle && (
              <span>· via @{callerHandle}</span>
            )}
            <span>· {formatDate(call.source_date ?? call.created_at)}</span>
          </div>
          <button
            onClick={copyLink}
            className="text-gray-400 hover:text-gray-600 active:text-gray-900 transition-colors flex items-center gap-1"
          >
            {linkCopied ? (
              <span className="text-[11px]">Copied!</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-[11px]">Copy link</span>
              </>
            )}
          </button>
        </div>
      </article>
    </div>
  );
}
