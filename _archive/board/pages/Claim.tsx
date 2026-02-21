import React, { useState, useEffect } from "react";
import { CallCard } from "../components/CallCard";
import type { Call } from "../types";

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "BRD-";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function Claim({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const [verificationCode] = useState(() => generateVerificationCode());
  const [attributedCalls, setAttributedCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/authors/${handle}`)
      .then((r) => r.json())
      .then((data) => {
        setAttributedCalls(data.error ? [] : data.calls ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [handle]);

  if (loading) return <div className="text-center text-gray-500 py-8">Loading...</div>;

  if (attributedCalls.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No calls found</h2>
        <p className="text-gray-500 mb-6">
          No calls on the board cite @{handle} as a source.
        </p>
        <a
          href="#/"
          className="min-h-[44px] inline-flex items-center text-gray-600 hover:text-gray-900 active:text-gray-900 text-sm font-medium"
        >
          Back to feed
        </a>
      </div>
    );
  }

  const totalWatchers = attributedCalls.reduce((sum, c) => sum + c.watchers, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {attributedCalls.length} call{attributedCalls.length !== 1 ? "s" : ""} cite your takes
        </h1>
        <p className="text-gray-600">
          Here's the track record built from @{handle}'s ideas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-lg font-bold text-gray-900">{attributedCalls.length}</div>
          <div className="text-xs text-gray-500">Calls Attributed</div>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 bg-white text-center">
          <div className="text-lg font-bold text-gray-900">
            {totalWatchers >= 1000 ? `${(totalWatchers / 1000).toFixed(1)}K` : totalWatchers}
          </div>
          <div className="text-xs text-gray-500">Watchers</div>
        </div>
      </div>

      <h2 className="text-sm font-medium text-gray-700 mb-3">Calls citing @{handle}</h2>
      <div className="flex flex-col gap-3 mb-8">
        {attributedCalls.map((call) => (
          <CallCard
            key={call.id}
            call={call}
            onClick={() => {
              window.location.hash = `/call/${call.id}`;
            }}
          />
        ))}
      </div>

      <div className="border border-gray-200 bg-gray-50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Claim These Calls</h2>
        <p className="text-sm text-gray-600 mb-4">
          Verify your identity via Twitter to claim your track record. Once verified,
          all calls citing @{handle} will be linked to your profile.
        </p>
        <button className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 active:scale-95 active:opacity-90 transition-colors mb-4">
          Claim These Calls
        </button>

        <div className="border border-gray-200 bg-white rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            Post this code to verify:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-900">
              {verificationCode}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 active:scale-95 active:bg-gray-100 transition-colors"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Post this code in a tweet from @{handle} so we can verify ownership.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 bg-white mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          Preview: your profile after claiming
        </h3>
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-gray-900">@{handle}</span>
            <svg
              className="w-4 h-4 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{attributedCalls.length}</div>
            <div className="text-xs text-gray-500">Calls</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {totalWatchers >= 1000 ? `${(totalWatchers / 1000).toFixed(1)}K` : totalWatchers}
            </div>
            <div className="text-xs text-gray-500">Watchers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
