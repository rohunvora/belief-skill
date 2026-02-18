import React, { useMemo, useState } from "react";
import type { Call, Comment, PriceLadderStep } from "../types";
import { extractChainDisplay } from "../types";
import { Avatar } from "../components/CallCard";
import { useLivePrices } from "../hooks/useLivePrices";
import { useBoardData } from "../hooks/useData";
import { timeAgo, formatPrice, formatWatchers, computePnl } from "../utils";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PriceLadder({
  steps,
  entry,
  currentPrice,
}: {
  steps: PriceLadderStep[];
  entry: number;
  currentPrice?: number;
}) {
  const sorted = [...steps].sort((a, b) => a.price - b.price);
  const maxAbs = Math.max(...sorted.map((s) => Math.abs(s.pnl_pct)));

  let closestIdx = -1;
  if (currentPrice != null) {
    let minDist = Infinity;
    sorted.forEach((step, i) => {
      const dist = Math.abs(step.price - currentPrice);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });
  }

  return (
    <div className="space-y-1.5">
      {sorted.map((step, i) => {
        const isEntry = step.pnl_pct === 0;
        const isPositive = step.pnl_pct > 0;
        const isClosest = i === closestIdx;
        const barWidth =
          maxAbs > 0 ? (Math.abs(step.pnl_pct) / maxAbs) * 100 : 0;

        return (
          <div
            key={i}
            className={`grid grid-cols-[80px_60px_1fr] gap-2 items-center text-sm rounded px-1 -mx-1 ${
              isClosest ? "bg-gray-100 ring-1 ring-gray-300" : ""
            }`}
          >
            <span
              className={`font-mono text-right ${isClosest ? "text-gray-900 font-semibold" : "text-gray-700"}`}
            >
              {formatPrice(step.price)}
            </span>
            <span
              className={`font-mono text-right text-xs font-medium ${
                isEntry
                  ? "text-gray-500"
                  : isPositive
                    ? "text-green-700"
                    : "text-red-600"
              }`}
            >
              {isEntry
                ? "\u2014"
                : `${isPositive ? "+" : ""}${step.pnl_pct}%`}
            </span>
            <div className="flex items-center gap-2">
              {!isEntry && (
                <div
                  className={`h-4 rounded-sm ${isPositive ? "bg-green-200" : "bg-red-200"}`}
                  style={{
                    width: `${Math.max(barWidth, 4)}%`,
                    maxWidth: "60%",
                  }}
                />
              )}
              {isEntry && (
                <div className="h-4 w-1 bg-gray-400 rounded-sm" />
              )}
              <span
                className={`text-xs ${isEntry ? "text-gray-600 font-medium" : "text-gray-500"}`}
              >
                {step.label}
                {isClosest && (
                  <span className="ml-1.5 text-gray-700 font-medium">
                    &larr; now
                  </span>
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const { getUserById } = useBoardData();
  const user = getUserById(comment.user_id);
  const handle = user?.handle ?? "unknown";

  return (
    <div className="flex gap-3 py-3">
      <a href={`#/u/${handle}`} onClick={(e) => e.stopPropagation()}>
        <Avatar handle={handle} size="sm" />
      </a>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 mb-0.5">
          <a
            href={`#/u/${handle}`}
            className="text-gray-700 hover:underline font-medium"
          >
            @{handle}
          </a>
          {" \u00b7 "}
          {timeAgo(comment.created_at)}
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export function CardDetail({ id }: { id: string }) {
  const { getCallById, getUserById, getUserByHandle, loading } = useBoardData();
  const [linkCopied, setLinkCopied] = useState(false);
  const call = getCallById(id);

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
          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          &larr; Back to feed
        </a>
      </div>
    );
  }

  const caller = getUserById(call.caller_id);
  const callerHandle = caller?.handle ?? "unknown";
  const displayHandle = call.source_handle ?? callerHandle;
  const displayUser = getUserByHandle(displayHandle);
  const comments: Comment[] = [];

  const isResolved = call.status === "resolved";
  const isExpired = call.status === "expired";
  const isClosed = call.status === "closed";
  const isActive = call.status === "active";

  // Live price for this single call
  const singleCallArray = useMemo(() => [call], [call.id]);
  const livePrices = useLivePrices(singleCallArray);
  const livePrice = livePrices.get(call.id);

  // Compute current P&L
  const pnl = isResolved
    ? call.resolve_pnl
    : livePrice
      ? computePnl(call.entry_price, livePrice.currentPrice, call.direction)
      : null;

  const isWinning = pnl != null && pnl >= 0;

  // Border accent based on status + performance
  const borderAccent = isResolved
    ? isWinning
      ? "border-l-green-500"
      : "border-l-red-500"
    : isExpired
      ? "border-l-gray-300"
      : isClosed
        ? "border-l-gray-400"
        : pnl != null
          ? isWinning
            ? "border-l-green-400"
            : "border-l-red-400"
          : "border-l-gray-200";

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/call/${call.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back navigation */}
      <a
        href="#/"
        className="inline-block text-sm text-gray-500 hover:text-gray-700 mb-3"
      >
        &larr; Feed
      </a>

      <article
        className={`border border-gray-200 border-l-[3px] ${borderAccent} rounded-lg bg-white p-5`}
      >
        {/* WHO — identity first, prominent */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar handle={displayHandle} size="lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <a
                  href={`#/u/${displayHandle}`}
                  className="text-base font-semibold text-gray-900 hover:underline"
                >
                  @{displayHandle}
                </a>
                {/* Twitter/X external link */}
                {displayUser?.twitter && (
                  <a
                    href={`https://x.com/${displayUser.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                    title={`@${displayUser.twitter} on X`}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {call.source_handle &&
                  call.source_handle !== callerHandle && (
                    <span className="text-xs text-gray-500">
                      via{" "}
                      <a
                        href={`#/u/${callerHandle}`}
                        className="hover:underline"
                      >
                        @{callerHandle}
                      </a>
                    </span>
                  )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(call.created_at)}
                {call.scan_source && (
                  <span className="ml-1.5">
                    &middot;{" "}
                    {call.source_url ? (
                      <a
                        href={call.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {call.scan_source}
                      </a>
                    ) : (
                      call.scan_source
                    )}
                  </span>
                )}
                {call.call_type !== "original" && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">
                    {call.call_type}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-xs text-gray-500" title={call.created_at}>
            {timeAgo(call.created_at)}
          </span>
        </div>

        {/* WHAT — the thesis, the claim */}
        <h1 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
          {call.thesis}
        </h1>

        {/* Source quote — the voice behind the claim, from chain */}
        {(() => {
          const chain = extractChainDisplay(call);
          if (!chain.source_said) return null;
          return (
            <div className="border-l-2 border-gray-300 pl-3 mb-3">
              <p className="text-sm text-gray-600 italic leading-relaxed">
                &ldquo;{chain.source_said}&rdquo;
              </p>
              {call.source_handle && (
                <p className="text-xs text-gray-500 mt-1">
                  —{" "}
                  {displayUser?.twitter ? (
                    <a
                      href={`https://x.com/${displayUser.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      @{call.source_handle}
                    </a>
                  ) : (
                    `@${call.source_handle}`
                  )}
                  {call.source_url && (
                    <a
                      href={call.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 text-gray-400 hover:text-gray-600 hover:underline"
                    >
                      View source &rarr;
                    </a>
                  )}
                </p>
              )}
            </div>
          );
        })()}

        {/* HOW TO PROFIT — trade data with P&L as punchline */}
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <a
              href={`#/?ticker=${call.ticker}`}
              className="text-lg font-bold text-gray-700 hover:underline"
            >
              {call.ticker}
            </a>
            <span
              className={`text-sm font-semibold ${
                call.direction === "long"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {call.direction === "long" ? "Long" : "Short"}
            </span>
            <span className="text-sm text-gray-500">
              {formatPrice(call.entry_price)}
            </span>
            {call.instrument && (
              <span className="text-xs text-gray-500">
                {call.instrument}
              </span>
            )}
            {call.platform && (
              <span className="text-xs text-gray-500">{call.platform}</span>
            )}
          </div>

          {/* P&L — the punchline */}
          {pnl != null && (
            <span
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                pnl >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {pnl >= 0 ? "+" : ""}
              {pnl.toFixed(1)}%
            </span>
          )}

          {isExpired && pnl == null && (
            <span className="text-sm font-bold text-gray-500">EXPIRED</span>
          )}
          {isClosed && pnl == null && (
            <span className="text-sm font-bold text-gray-500">CLOSED</span>
          )}
        </div>

        {/* Resolved badge + context */}
        {isResolved && call.resolve_pnl != null && (
          <div className="mb-3">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                call.resolve_pnl >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {call.resolve_pnl >= 0 ? "CALLED IT" : "MISSED"}
            </span>
            {call.resolve_date && (
              <span className="text-xs text-gray-500 ml-2">
                {formatDate(call.created_at)} &rarr;{" "}
                {formatDate(call.resolve_date)}
              </span>
            )}
            {call.resolve_price != null && (
              <span className="text-xs text-gray-500 ml-2">
                exit {formatPrice(call.resolve_price)}
              </span>
            )}
          </div>
        )}

        {/* Live price context for active calls */}
        {isActive && livePrice && (
          <div className="text-sm text-gray-500 mb-3">
            Now {formatPrice(livePrice.currentPrice)}
            <span className="text-gray-300 mx-1">&middot;</span>
            <span
              className={
                pnl != null && pnl >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {livePrice.changeDollars >= 0 ? "+" : ""}
              {formatPrice(Math.abs(livePrice.changeDollars))} from entry
            </span>
          </div>
        )}

        {/* Price ladder */}
        {call.price_ladder && call.price_ladder.length > 0 && (
          <div className="border border-gray-200 rounded-md p-4 mb-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-3">
              {formatPrice(call.entry_price)} entry
            </div>
            <PriceLadder
              steps={call.price_ladder}
              entry={call.entry_price}
              currentPrice={livePrice?.currentPrice}
            />
          </div>
        )}

        {/* Trade info (for cards without a ladder) */}
        {!call.price_ladder && (
          <div className="flex items-baseline gap-4 text-sm mb-3">
            <span className="text-gray-500">
              Entry{" "}
              <span className="font-medium text-gray-900">
                {formatPrice(call.entry_price)}
              </span>
            </span>
            {call.breakeven && (
              <span className="text-gray-500">
                Breakeven{" "}
                <span className="font-medium text-gray-900">
                  {call.breakeven}
                </span>
              </span>
            )}
          </div>
        )}

        {/* HOW TO LEARN — reasoning chain prominent, not collapsed */}

        {/* Reasoning — the "why" behind the call */}
        {call.reasoning && (
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {call.reasoning}
          </p>
        )}

        {/* Derivation chain — auditable 5-step trail */}
        {(() => {
          const chain = extractChainDisplay(call);
          if (!chain.hasChain) return null;
          const steps = [
            { label: "Source said", value: chain.source_said },
            { label: "Implies", value: chain.implies },
            { label: "Searching for", value: chain.searching_for },
            { label: "Found because", value: chain.found_because },
            { label: "Chose over", value: chain.chose_over },
          ].filter((s) => s.value);
          if (steps.length === 0) return null;
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3 space-y-1.5">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Derivation Chain
              </div>
              {steps.map((step, i) => (
                <div key={i} className="text-xs text-gray-600">
                  <span className="font-medium text-gray-700">
                    {step.label}:
                  </span>{" "}
                  {step.value}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Edge */}
        {call.edge && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {call.edge}
          </p>
        )}

        {/* Counter */}
        {call.counter && (
          <p className="text-sm text-gray-500 leading-relaxed mb-3">
            <span className="font-medium text-gray-600">Counter:</span>{" "}
            {call.counter}
          </p>
        )}

        {/* Alternative */}
        {call.alternative && (
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-medium">Alt:</span> {call.alternative}
          </p>
        )}

        {/* Kill condition — demoted to small context, not a primary element */}
        {call.kills && (
          <p className="text-xs text-gray-500 mb-3">
            Invalidated if: {call.kills}
          </p>
        )}

        {isResolved && call.resolve_note && (
          <p className="text-sm text-gray-600 italic mb-3">
            {call.resolve_note}
          </p>
        )}

        {/* Social proof footer + share */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {call.votes > 0 && (
              <span className="font-medium">+{call.votes}</span>
            )}
            {call.watchers > 0 && (
              <span className="font-medium">
                {formatWatchers(call.watchers)} watching
              </span>
            )}
          </div>
          <button
            onClick={copyLink}
            className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            {linkCopied ? (
              <span className="text-[11px]">Copied</span>
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

      {/* Comments — only render if there are any */}
      {comments.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">
            {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </div>
          <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 px-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
