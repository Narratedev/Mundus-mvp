"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Flame, ShieldCheck, TrendingUp } from "lucide-react";

type Token = {
  id?: string;
  network: string;
  contract_address: string;
  symbol: string;
  name: string;
  image_url?: string | null;
  image?: string | null;
  decimals?: number | null;
  is_verified?: boolean;
};

type TrendingToken = {
  token: Token;
  calls: number;
  agrees: number;
  disagrees: number;
  comments: number;
  score: number;
};

type MarketData = {
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
};

type LookupResult = {
  symbol: string;
  name: string;
  address: string;
  price_usd?: string;
  image?: string | null;
  decimals?: number;
};

function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "—";
  }

  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;

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

  if (value >= 0.01) return `$${value.toFixed(4)}`;

  return `$${value.toPrecision(4)}`;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trending, setTrending] = useState<TrendingToken[]>([]);
  const [market, setMarket] = useState<Record<string, MarketData>>({});
  const [lookup, setLookup] = useState<LookupResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

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
          if (entry) marketMap[entry[0]] = entry[1];
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

  async function searchToken() {
    const value = query.trim();

    if (!value) {
      setLookup(null);
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");
    setLookup(null);

    try {
      const response = await fetch(
        `/api/tokens/lookup?network=solana&address=${encodeURIComponent(value)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || "Token not found");
        return;
      }

      setLookup(data);
    } catch {
      setSearchError("Unable to search token");
    } finally {
      setSearching(false);
    }
  }

  const filteredTokens = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return tokens;

    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(value) ||
        token.name.toLowerCase().includes(value) ||
        token.contract_address.toLowerCase().toLowerCase().includes(value)
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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          searchToken();
        }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLookup(null);
            setSearchError("");
          }}
          placeholder="Search ticker, name or contract address..."
          className="w-full rounded-xl glass py-3 pl-10 pr-24 text-sm outline-none transition focus:ring-1 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={searching}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-medium transition hover:bg-white/[0.12] disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </form>

      {lookup && (
        <section className="space-y-3">
          <div className="text-sm font-medium text-zinc-400">
            Token found
          </div>

          <Link
            href={`/token/search?network=solana&address=${encodeURIComponent(
              lookup.address
            )}`}
            className="glass block rounded-2xl p-4 transition hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              {lookup.image ? (
                <img
                  src={lookup.image}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] font-semibold">
                  {lookup.symbol.slice(0, 2)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    ${lookup.symbol}
                  </span>

                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                    UNVERIFIED
                  </span>
                </div>

                <div className="text-sm text-zinc-500">
                  {lookup.name}
                </div>

                <div className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                  {lookup.address}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium">
                  {lookup.price_usd
                    ? formatPrice(Number(lookup.price_usd))
                    : "—"}
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {searchError && (
        <div className="glass rounded-2xl p-4 text-sm text-zinc-500">
          {searchError}
        </div>
      )}

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
              No trending tokens yet.
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
                          {item.calls} calls ·{" "}
                          {item.agrees +
                            item.disagrees +
                            item.comments}{" "}
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

      {!query && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Verified tokens</h2>
          </div>

          {loading ? (
            <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
              Loading tokens...
            </div>
          ) : tokens.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
              No verified tokens yet.
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
      )}
    </div>
  );
}
