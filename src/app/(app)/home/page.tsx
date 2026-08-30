"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatPct, calcPerformance } from "@/lib/utils";
import { MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

type Call = {
  id: string;
  symbol: string;
  token_name: string | null;
  direction: "bullish" | "bearish";
  entry_price: number;
  target_price: number;
  invalidation_price: number | null;
  timeframe: string;
  thesis: string;
  status: string;
  agrees_count: number;
  disagrees_count: number;
  comments_count: number;
  contract_address: string;
  network: string;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    accuracy: number;
    resolved_calls: number;
  } | null;
};

export default function HomePage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("calls")
        .select(
          `
          *,
          profiles:user_id (username, display_name, accuracy, resolved_calls)
        `
        )
        .order("created_at", { ascending: false })
        .limit(30);

      if (!error && data) {
        setCalls(data as Call[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">For You</h1>

      {calls.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-zinc-400 mb-4">No calls yet. Be the first.</p>
          <Link
            href="/post"
            className="inline-flex rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Make a Call
          </Link>
        </div>
      )}

      {calls.map((call) => {
        const current = prices[call.contract_address] ?? call.entry_price;
        const perf = calcPerformance(call.entry_price, current, call.direction);
        const isPositive = perf >= 0;

        return (
          <article key={call.id} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Link
                href={`/profile/${call.profiles?.username || "user"}`}
                className="flex items-center gap-2"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
                <div>
                  <div className="text-sm font-medium">
                    {call.profiles?.display_name ||
                      call.profiles?.username ||
                      "Anon"}
                  </div>
                  <div className="text-xs text-emerald-400">
                    {call.profiles?.accuracy?.toFixed(0) || 0}% ·{" "}
                    {call.profiles?.resolved_calls || 0} calls
                  </div>
                </div>
              </Link>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium badge-${call.status}`}
              >
                {call.status.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">{call.symbol}</span>
              <span
                className={`text-xs font-medium ${
                  call.direction === "bullish"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {call.direction === "bullish" ? "Bullish" : "Bearish"}
              </span>
              <span className="ml-auto text-xs text-zinc-500">
                {call.timeframe}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-zinc-500 text-xs">Called</div>
                <div className="font-medium">{formatPrice(call.entry_price)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs">Current</div>
                <div className="font-medium">{formatPrice(current)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs">Target</div>
                <div className="font-medium">{formatPrice(call.target_price)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs">Perf</div>
                <div
                  className={`font-medium ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatPct(perf)}
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">{call.thesis}</p>

            <div className="flex items-center gap-3 pt-1">
              <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 transition">
                <ThumbsUp className="h-3.5 w-3.5" />
                {call.agrees_count}
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 transition">
                <ThumbsDown className="h-3.5 w-3.5" />
                {call.disagrees_count}
              </button>
              <button className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 transition">
                <MessageCircle className="h-3.5 w-3.5" />
                {call.comments_count}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
