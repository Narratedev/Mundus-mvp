"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Flame, ShieldCheck, TrendingUp } from "lucide-react";

type Token = {
  id: string;
  network: string;
  contract_address: string;
  symbol: string;
  name: string;
  image_url: string | null;
  decimals?: number | null;
  is_verified: boolean;
};

type TrendingToken = {
  token: Token;
  calls: number;
  agrees: number;
  disagrees: number;
  comments: number;
  score: number;
  latestCall: string;
};

type MarketData = {
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
};

function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })}`;
}

function formatPrice(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }

  if (value >= 1) {
    return `$${value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  if (value >= 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toPrecision(4)}`;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trending, setTrending] = useState<TrendingToken[]>([]);
  const [market, setMarket] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tokenResponse, trendingResponse] = await Promise.all([
          fetch("/api/tokens/verified"),
          fetch("/api/trending"),
        ]);

        const tokenData = await tokenResponse.json();
        const trendingData = await trendingResponse.json();

        setTokens(tokenData.tokens ?? []);
        setTrending(trendingData.tokens ?? []);

        const allTokens = [
          ...(tokenData.tokens ?? []),
          ...(trendingData.tokens ?? []).map(
            (item: TrendingToken) => item.token
          ),
        ];

        const unique = Array.from(
          new Map(
            allTokens.map((token: Token) => [
              `${token.network}:${token.contract_address}`,
              token,
            ])
          ).values()
        );

        const marketEntries = await Promise.all(
          unique.map(async (token: Token) => {
            try {
              const response = await fetch(
                `/api/prices?network=${encodeURIComponent(
                  token.network
                )}&address=${encodeURIComponent(token.contract_address)}`
              );

              if (!response.ok) return null;

              const data = await response.json();

              return [
                `${token.network}:${token.contract_address}`,
                data,
              ] as const;
            } catch {
              return null;
            }
          })
        );

        const marketMap: Record<string, MarketData> = {};

        for (const entry of marketEntries) {
          if (entry) {
            marketMap[entry[0]] = entry[1];
          }
        }

        setMarket(marketMap);
      } catch (error) {
        console.error("Explore loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredTokens = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return tokens;

    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(value) ||
        token.name.toLowerCase().includes(value) ||
        token.contract_address.toLowerCase().includes(value)
    );
  }, [tokens, query]);

  function getMarket(token: Token) {
    return market[`${token.network}:${token.contract_address}`] ?? {};
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Discover what the Mundus community is watching.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search verified tokens..."
          className="w-full rounded-xl glass py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {!query && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Trending</h2>
            <span className="text-xs text-zinc-500">
              Top 5 by Mundus activity
            </span>
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
              Loading trending tokens...
            </div>
          ) : trending.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
              No trending tokens yet. As the community creates calls and
              engages with them, the most active tokens will appear here.
            </div>
          ) : (
            <div className="grid gap-3">
              {trending.map((item, index) => {
                const token = item.token;
                const data = getMarket(token);
                const change = data.priceChange24h ?? 0;

                return (
                  <Link
                    key={token.id}
                    href={`/token/${token.id}`}
                    className="glass rounded-2xl p-4 transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-semibold">
                        {index + 1}
                      </div>

                      {token.image_url ? (
                        <img
                          src={token.image_url}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold">
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">
                            ${token.symbol}
                          </span>
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                        </div>

                        <div className="text-xs text-zinc-500">
                          {item.calls} {item.calls === 1 ? "call" : "calls"} ·{" "}
                          {item.agrees + item.disagrees + item.comments}{" "}
                          engagements
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatPrice(data.price)}
                        </div>

                        <div
                          className={`text-xs ${
                            change >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {change >= 0 ? "+" : ""}
                          {change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            {query ? "Search results" : "Verified tokens"}
          </h2>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
            Loading tokens...
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-zinc-500">
            No verified tokens found.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTokens.map((token) => {
              const data = getMarket(token);
              const change = data.priceChange24h ?? 0;

              return (
                <Link
                  key={token.id}
                  href={`/token/${token.id}`}
                  className="glass rounded-2xl p-4 transition hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    {token.image_url ? (
                      <img
                        src={token.image_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">
                          ${token.symbol}
                        </span>
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                      </div>

                      <div className="truncate text-xs text-zinc-500">
                        {token.name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPrice(data.price)}
                      </div>

                      <div
                        className={`text-xs ${
                          change >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {change >= 0 ? "+" : ""}
                        {change.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-5 border-t border-white/[0.05] pt-3 text-xs text-zinc-500">
                    <span>
                      Volume{" "}
                      <span className="text-zinc-300">
                        {formatNumber(data.volume24h)}
                      </span>
                    </span>

                    <span>
                      Market Cap{" "}
                      <span className="text-zinc-300">
                        {formatNumber(data.marketCap)}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
