"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatPct, calcPerformance } from "@/lib/utils";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

type Token = {
  symbol: string;
  name: string;
  address: string;
  price_usd: string | number | null;
  image: string | null;
  decimals: number | null;
};

type Call = {
  id: string;
  symbol: string;
  token_name: string | null;
  direction: "bullish" | "bearish";
  entry_price: number;
  target_price: number;
  invalidation_price: number | null;
  status: string;
  thesis: string;
  timeframe: string;
  created_at: string;
  user_id: string;
  contract_address: string;
  network: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    accuracy: number;
  } | null;
};

export default function TokenPage() {
  const params = useParams();

  const network = String(params.network);
  const address = String(params.address);

  const [token, setToken] = useState<Token | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadToken(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const tokenRes = await fetch(
        `/api/tokens/lookup?network=${encodeURIComponent(
          network
        )}&address=${encodeURIComponent(address)}`
      );

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData?.symbol) {
        throw new Error(
          tokenData?.error || "Token not found"
        );
      }

      setToken(tokenData);

      const priceRes = await fetch(
        `/api/prices?network=${encodeURIComponent(
          network
        )}&addresses=${encodeURIComponent(address)}`
      );

      const priceData = await priceRes.json();

      const livePrice =
        priceData?.data?.[address]?.price ??
        priceData?.data?.[address]?.price_usd ??
        priceData?.data?.[address]?.attributes?.price_usd ??
        tokenData?.price_usd;

      if (livePrice) {
        setPrice(Number(livePrice));
      }

      const supabase = createClient();

      const { data: callsData, error: callsError } =
        await supabase
          .from("calls")
          .select(`
            *,
            profiles:user_id (
              username,
              display_name,
              accuracy
            )
          `)
          .eq("network", network)
          .eq("contract_address", address)
          .order("created_at", {
            ascending: false,
          })
          .limit(50);

      if (callsError) {
        throw callsError;
      }

      setCalls((callsData || []) as Call[]);
    } catch (err: any) {
      setError(
        err?.message || "Failed to load token"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (network && address) {
      loadToken();
    }
  }, [network, address]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="space-y-4">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Link>

        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-lg font-semibold">
            Token not found
          </h1>

          <p className="text-sm text-zinc-500">
            {error || "We couldn't find this token."}
          </p>
        </div>
      </div>
    );
  }

  const currentPrice =
    price ?? Number(token.price_usd || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Explore
        </Link>

        <button
          onClick={() => loadToken(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl glass px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {/* TOKEN HEADER */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {token.image ? (
            <img
              src={token.image}
              alt={token.symbol}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold">
              {token.symbol?.slice(0, 2)}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">
                ${token.symbol}
              </h1>

              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase text-emerald-400">
                {network}
              </span>
            </div>

            <p className="text-sm text-zinc-500 truncate">
              {token.name}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-3xl font-bold">
            {formatPrice(currentPrice)}
          </div>

          <div className="text-xs text-zinc-500 mt-1">
            Live market price
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-black/20 p-3">
          <div className="text-xs text-zinc-500">
            Contract
          </div>

          <div className="mt-1 break-all font-mono text-xs text-zinc-400">
            {token.address}
          </div>
        </div>
      </div>

      {/* TOKEN STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-zinc-500">
            Community Calls
          </div>

          <div className="text-xl font-semibold mt-1">
            {calls.length}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="text-xs text-zinc-500">
            Decimals
          </div>

          <div className="text-xl font-semibold mt-1">
            {token.decimals ?? "—"}
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            Price History
          </h2>

          <span className="text-xs text-zinc-500">
            Live data
          </span>
        </div>

        <div className="h-48 rounded-xl bg-black/20 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-zinc-400">
              Historical chart coming next
            </div>

            <div className="text-xs text-zinc-600 mt-1">
              Premium users will get deeper token history.
            </div>
          </div>
        </div>
      </div>

      {/* COMMUNITY CALLS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Community Calls
          </h2>

          <span className="text-xs text-zinc-500">
            {calls.length}
          </span>
        </div>

        {calls.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-zinc-500">
              Nobody has made a call on this token yet.
            </p>

            <Link
              href="/post"
              className="inline-block mt-4 rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white"
            >
              Make the first call
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const callPrice =
                currentPrice || Number(call.entry_price);

              const performance = calcPerformance(
                Number(call.entry_price),
                callPrice,
                call.direction
              );

              return (
                <Link
                  key={call.id}
                  href={`/call/${call.id}`}
                  className="block glass rounded-2xl p-4 hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          ${call.symbol}
                        </span>

                        <span
                          className={
                            call.direction === "bullish"
                              ? "text-xs text-emerald-400"
                              : "text-xs text-rose-400"
                          }
                        >
                          {call.direction === "bullish"
                            ? "Bullish"
                            : "Bearish"}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-500 mt-1">
                        {call.profiles?.display_name ||
                          call.profiles?.username ||
                          "Anonymous"}
                      </div>
                    </div>

                    <div
                      className={
                        performance >= 0
                          ? "text-emerald-400 text-sm font-medium"
                          : "text-rose-400 text-sm font-medium"
                      }
                    >
                      {formatPct(performance)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500">
                        Entry
                      </div>
                      <div>
                        {formatPrice(call.entry_price)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500">
                        Current
                      </div>
                      <div>
                        {formatPrice(callPrice)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500">
                        Target
                      </div>
                      <div>
                        {formatPrice(call.target_price)}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300 leading-relaxed line-clamp-2">
                    {call.thesis}
                  </p>

                  <div className="flex items-center justify-between mt-3 text-xs text-zinc-600">
                    <span>
                      {call.timeframe}
                    </span>

                    <span>
                      {new Date(
                        call.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* TOKEN ACTION */}
      <a
        href={`https://dexscreener.com/${network}/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl glass px-4 py-3 text-sm text-zinc-300 hover:bg-white/10"
      >
        View market
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
