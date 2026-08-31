"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatPct, calcPerformance } from "@/lib/utils";
import { ArrowLeft, Copy, Check } from "lucide-react";

type Call = {
  id: string;
  user_id: string;
  network: string;
  contract_address: string;
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
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    accuracy: number;
    resolved_calls: number;
  } | null;
};

export default function CallPage() {
  const params = useParams();
  const id = params.id as string;

  const [call, setCall] = useState<Call | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("calls")
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            accuracy,
            resolved_calls
          )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Call not found.");
        setLoading(false);
        return;
      }

      setCall(data as Call);

      try {
        const res = await fetch(
          `/api/prices?network=${data.network}&addresses=${data.contract_address}`
        );

        const priceData = await res.json();

        const livePrice =
          priceData?.data?.[data.contract_address]?.price ||
          priceData?.data?.[data.contract_address]?.price_usd;

        if (livePrice) {
          setPrice(Number(livePrice));
        }
      } catch {
        // Keep entry price if live price fails.
      }

      setLoading(false);
    }

    if (id) load();
  }, [id]);

  async function shareCall() {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Could not copy the link.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  if (!call) {
    return (
      <div className="space-y-4">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="glass rounded-2xl p-8 text-center text-zinc-400">
          {error || "Call not found."}
        </div>
      </div>
    );
  }

  const current = price ?? call.entry_price;

  const performance = calcPerformance(
    Number(call.entry_price),
    current,
    call.direction
  );

  const positive = performance >= 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <button
          onClick={shareCall}
          className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-sm hover:bg-white/10 transition"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Share
            </>
          )}
        </button>
      </div>

      <article className="glass rounded-2xl p-5 space-y-5">
        <Link
          href={`/profile/${call.profiles?.username || call.user_id}`}
          className="flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />

          <div>
            <div className="font-medium">
              {call.profiles?.display_name ||
                call.profiles?.username ||
                "Anon"}
            </div>

            <div className="text-xs text-zinc-500">
              {call.profiles?.accuracy?.toFixed(0) || 0}% accuracy ·{" "}
              {call.profiles?.resolved_calls || 0} resolved
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">
            ${call.symbol}
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              call.direction === "bullish"
                ? "bg-emerald-400/10 text-emerald-400"
                : "bg-rose-400/10 text-rose-400"
            }`}
          >
            {call.direction === "bullish" ? "Bullish" : "Bearish"}
          </span>

          <span className="ml-auto text-xs text-zinc-500">
            {call.timeframe}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3">
            <div className="text-xs text-zinc-500">Entry</div>
            <div className="font-semibold mt-1">
              {formatPrice(call.entry_price)}
            </div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="text-xs text-zinc-500">Current</div>
            <div className="font-semibold mt-1">
              {formatPrice(current)}
            </div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="text-xs text-zinc-500">Target</div>
            <div className="font-semibold mt-1">
              {formatPrice(call.target_price)}
            </div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="text-xs text-zinc-500">Performance</div>
            <div
              className={`font-semibold mt-1 ${
                positive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {formatPct(performance)}
            </div>
          </div>
        </div>

        {call.invalidation_price && (
          <div className="text-sm">
            <span className="text-zinc-500">Invalidation: </span>
            {formatPrice(call.invalidation_price)}
          </div>
        )}

        <div>
          <div className="text-xs text-zinc-500 mb-2">
            Thesis
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed">
            {call.thesis}
          </p>
        </div>

        <div className="text-xs text-zinc-500">
          {call.network} · {call.contract_address}
        </div>
      </article>

      {error && (
        <p className="text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
