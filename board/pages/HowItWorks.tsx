import React from "react";
import { CallCard, Avatar, formatPrice } from "../components/CallCard";
import { useBoardData } from "../hooks/useData";
import type { Call, User } from "../types";

/** Annotation label — small colored tag pointing to a part of the UI */
function Label({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "green" | "red";
}) {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded ${colors[color]}`}
    >
      {children}
    </span>
  );
}

/** Step wrapper — number, heading, context, then children (the visual) */
function Step({
  number,
  heading,
  context,
  children,
}: {
  number: number;
  heading: string;
  context: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="text-sm font-bold text-gray-300 tabular-nums">
          {number}
        </span>
        <h2 className="text-xl font-bold text-gray-900">{heading}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4 ml-7">{context}</p>
      <div className="ml-7">{children}</div>
    </section>
  );
}

/** Fake source quote block — represents the raw take before structuring */
function RawTake() {
  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <img
          src="https://pbs.twimg.com/profile_images/1883600182165848064/-9LbG3md_400x400.jpg"
          alt="chamath"
          className="w-8 h-8 rounded-full"
        />
        <div>
          <span className="text-sm font-semibold text-gray-900">
            @chamath
          </span>
          <span className="text-xs text-gray-500 ml-1.5">
            All-In Podcast &middot; Feb 14, 2026
          </span>
        </div>
      </div>
      <p className="text-base text-gray-800 leading-snug italic">
        "The AI buildout has a beneficiary nobody's pricing in. On-prem is
        back and DELL is the pick-and-shovel play."
      </p>
      <div className="mt-2 flex gap-2">
        <Label color="gray">Raw take</Label>
        <Label color="gray">Unstructured</Label>
        <Label color="gray">No tracking</Label>
      </div>
    </div>
  );
}

/** Mini contributors list for the "track records" step */
function MiniContributors() {
  const { users, calls } = useBoardData();

  // Rank by total calls submitted
  const topUsers = users
    .map((u) => ({
      ...u,
      total_calls: calls.filter((c) => c.caller_id === u.id).length,
    }))
    .filter((u) => u.total_calls > 0)
    .sort((a, b) => b.total_calls - a.total_calls)
    .slice(0, 4);

  if (topUsers.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-4">
        No contributors yet.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {topUsers.map((user, i) => {
        const rank = i + 1;

        return (
          <div
            key={user.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              i < topUsers.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <span
              className={`w-5 text-right font-bold tabular-nums text-sm ${
                rank === 1
                  ? "text-yellow-500"
                  : rank === 2
                    ? "text-gray-500"
                    : rank === 3
                      ? "text-orange-400"
                      : "text-gray-300"
              }`}
            >
              {rank}
            </span>
            <Avatar handle={user.handle} size="sm" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">
                @{user.handle}
              </span>
              <span className="text-xs text-gray-500 ml-1.5">
                {user.total_calls} calls
              </span>
            </div>
            <span className="text-lg font-extrabold tabular-nums text-gray-900">
              {user.total_calls}
            </span>
          </div>
        );
      })}
      <div className="px-4 py-2 border-t border-gray-100">
        <Label color="gray">Ranked by total calls submitted</Label>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const { calls, loading } = useBoardData();

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-8">Loading...</div>
    );
  }

  // Pick example calls from seed data
  const exampleCall = calls.find((c) => c.ticker === "DELL") || calls[0];
  const exampleCall2 = calls.find((c) => c.id !== exampleCall?.id) || null;

  const structuredCall = exampleCall || calls[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header — minimal */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          How it works
        </h1>
        <p className="text-sm text-gray-500">
          From raw take to verified track record in 4 steps.
        </p>
      </div>

      {/* Step 1: The raw take */}
      <Step
        number={1}
        heading="Someone makes a call"
        context="Every day, traders and analysts share directional takes on Twitter, podcasts, and group chats. Most disappear into the timeline."
      >
        <RawTake />
      </Step>

      {/* Step 2: Structured call */}
      <Step
        number={2}
        heading="Structured into a trade thesis"
        context="Every call gets a ticker, direction, entry price, and a reasoning chain showing how the AI got there. Source link and timestamp are always preserved — anyone can verify."
      >
        {structuredCall ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Label color="gray">Who said it</Label>
              <Label color="gray">The claim</Label>
              <Label color="green">The trade</Label>
              <Label color="gray">Reasoning chain</Label>
            </div>
            <CallCard
              call={structuredCall}
              onClick={() => {
                window.location.hash = `/call/${structuredCall.id}`;
              }}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-4">
            No calls to show.
          </div>
        )}
      </Step>

      {/* Step 3: Live tracking */}
      <Step
        number={3}
        heading="Tracked against reality"
        context="P&L updates with live prices. Green when winning, red when losing. No editing, no deleting. The market decides."
      >
        <div className="flex flex-col gap-3">
          {exampleCall && (
            <CallCard
              call={exampleCall}
              onClick={() => {
                window.location.hash = `/call/${exampleCall.id}`;
              }}
            />
          )}
          {exampleCall2 && (
            <CallCard
              call={exampleCall2}
              onClick={() => {
                window.location.hash = `/call/${exampleCall2.id}`;
              }}
            />
          )}
          {!exampleCall && !exampleCall2 && (
            <div className="text-sm text-gray-500 py-4">
              No tracked calls yet.
            </div>
          )}
          <div className="flex gap-2">
            <Label color="green">Live P&L</Label>
            <Label color="gray">Updated every 30 seconds</Label>
          </div>
        </div>
      </Step>

      {/* Step 4: Track records */}
      <Step
        number={4}
        heading="Track records reveal who's actually good"
        context="Every call lives forever with live P&L. Contributors are ranked by volume. Over time, the best callers surface."
      >
        <MiniContributors />
      </Step>

      {/* CTA */}
      <div className="text-center py-8 border-t border-gray-200 mt-4">
        <p className="text-sm text-gray-500 mb-4">
          See it in action.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="#/"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
            Explore the feed
          </a>
          <a
            href="#/contributors"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            View contributors
          </a>
        </div>
      </div>
    </div>
  );
}
