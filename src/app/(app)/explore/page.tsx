"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Flame,
  ShieldCheck,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  UserRound,
  ArrowUpRight,
} from "lucide-react";

type Token = {
  id?: string;
  network: string;
  contract_address: string;
  symbol: string;
  name: string;
  image_url?: string | null;
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

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  accuracy: number;
  resolved_calls: number;
  hits: number;
  misses: number;
  active_calls: number;
  followers_count: number;
  following_count: number;
};

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
  status: string;
  performance_pct: number | null;
  thesis: string;
  timeframe: string;
  created_at: string;
  agrees_count: number;
  disagrees_count: number;
  comments_count: number;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    accuracy: number;
    resolved_calls: number;
  } | null;
};

type LookupResult = {
  network: string;
  symbol: string;
  name: string;
  address: string;
  price_usd?: string | null;
  image?: string | null;
  decimals?: number | null;
};

type ExploreResponse = {
  trendingTokens: TrendingToken[];
  trendingCalls: Call[];
  discoverUsers: Profile[];
  verifiedTokens: Token[];
};

function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "—";

  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  if (number >= 1) {
    return `$${number.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;
  }

  if (number >= 0.01) {
    return `$${number.toFixed(4)}`;
  }

  return `$${number.toPrecision(4)}`;
}

function shortAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function tokenHref(token: Token) {
  return `/token/${token.network}/${encodeURIComponent(
    token.contract_address
  )}`;
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [network, setNetwork] = useState("solana");

  const [data, setData] = useState<ExploreResponse>({
    trendingTokens: [],
    trendingCalls: [],
    discoverUsers: [],
    verifiedTokens: [],
  });

  const [lookup, setLookup] = useState<LookupResult | null>(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    async function loadExplore() {
      try {
        const response = await fetch("/api/explore");

        if (!response.ok) {
          throw new Error("Failed to load Explore");
        }

        const result = await response.json();

        setData({
          trendingTokens: result.trendingTokens ?? [],
          trendingCalls: result.trendingCalls ?? [],
          discoverUsers: result.discoverUsers ?? [],
          verifiedTokens: result.verifiedTokens ?? [],
        });
      } catch (error) {
        console.error("Explore loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadExplore();
  }, []);

  async function searchToken() {
    const value = query.trim();

    if (!value) {
      setLookup(null);
      setSearchError("");
      return;
    }

    setSearching(true);
    setLookup(null);
    setSearchError("");

    try {
      const response = await fetch(
        `/api/tokens/lookup?network=${encodeURIComponent(
          network
        )}&address=${encodeURIComponent(value)}`
      );

      const result = await response.json();

      if (!response.ok) {
        setSearchError(result.error || "Token not found");
        return;
      }

      setLookup(result);
    } catch (error) {
      console.error("Token search error:", error);
      setSearchError("Unable to search token");
    } finally {
      setSearching(false);
    }
  }

  const hasSearch = query.trim().length > 0;

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Explore
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Discover tokens, calls and people worth watching.
        </p>
      </div>

      {/* SEARCH */}
      <section className="space-y-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            searchToken();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLookup(null);
                setSearchError("");
              }}
              placeholder="Search token contract address..."
              className="w-full rounded-xl glass py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={network}
            onChange={(event) => setNetwork(event.target.value)}
            className="rounded-xl glass px-3 text-sm outline-none"
          >
            <option value="solana">Solana</option>
            <option value="eth">Ethereum</option>
            <option value="base">Base</option>
            <option value="bsc">BNB</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="polygon">Polygon</option>
          </select>

          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-white/[0.08] px-4 text-sm font-medium transition hover:bg-white/[0.12] disabled:opacity-50"
          >
            {searching ? "..." : "Search"}
          </button>
        </form>

        {lookup && (
          <Link
            href={`/token/${lookup.network}/${encodeURIComponent(
              lookup.address
            )}`}
            className="glass block rounded-2xl p-4 transition hover:bg-white/[0.05]"
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
                  {lookup.symbol?.slice(0, 2)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    ${lookup.symbol}
                  </span>

                  <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                    UNVERIFIED
                  </span>
                </div>

                <div className="text-sm text-zinc-500">
                  {lookup.name}
                </div>

                <div className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                  {shortAddress(lookup.address)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium">
                  {formatPrice(lookup.price_usd)}
                </div>

                <ArrowUpRight className="ml-auto mt-1 h-4 w-4 text-zinc-600" />
              </div>
            </div>
          </Link>
        )}

        {searchError && (
          <div className="glass rounded-xl p-4 text-sm text-zinc-500">
            {searchError}
          </div>
        )}

        {hasSearch && !lookup && !searching && !searchError && (
          <div className="glass rounded-xl p-4 text-sm text-zinc-500">
            Enter a token contract address to search.
          </div>
        )}
      </section>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-zinc-500">
          Loading Explore...
        </div>
      ) : (
        <>
          {/* TRENDING TOKENS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Trending Tokens
              </h2>

              <span className="text-xs text-zinc-500">
                Community activity
              </span>
            </div>

            {data.trendingTokens.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
                No trending tokens yet. Create the first call for a token.
              </div>
            ) : (
              <div className="grid gap-3">
                {data.trendingTokens.map((item, index) => {
                  const token = item.token;

                  return (
                    <Link
                      key={`${token.network}:${token.contract_address}`}
                      href={tokenHref(token)}
                      className="glass rounded-2xl p-4 transition hover:bg-white/[0.05]"
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

                            {token.is_verified && (
                              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                            )}
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            {item.calls} calls ·{" "}
                            {item.agrees} agrees ·{" "}
                            {item.disagrees} disagrees ·{" "}
                            {item.comments} comments
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs capitalize text-zinc-500">
                            {token.network}
                          </div>

                          <div className="mt-1 text-xs font-medium text-indigo-400">
                            Score {item.score}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* TRENDING CALLS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Trending Calls
              </h2>

              <span className="text-xs text-zinc-500">
                What people are discussing
              </span>
            </div>

            {data.trendingCalls.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
                No calls yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.trendingCalls.map((call) => (
                  <Link
                    key={call.id}
                    href={`/call/${call.id}`}
                    className="block glass rounded-2xl p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            ${call.symbol}
                          </span>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              call.direction === "bullish"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {call.direction === "bullish"
                              ? "Bullish"
                              : "Bearish"}
                          </span>
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {call.profiles?.display_name ||
                            call.profiles?.username ||
                            "Anonymous"}{" "}
                          · {call.timeframe}
                        </div>
                      </div>

                      <span className="text-xs capitalize text-zinc-600">
                        {call.status}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-300">
                      {call.thesis}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {call.agrees_count ?? 0}
                      </span>

                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3.5 w-3.5" />
                        {call.disagrees_count ?? 0}
                      </span>

                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {call.comments_count ?? 0}
                      </span>

                      <span className="ml-auto">
                        {new Date(call.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* DISCOVER USERS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Discover People
              </h2>

              <span className="text-xs text-zinc-500">
                Traders worth watching
              </span>
            </div>

            {data.discoverUsers.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
                No creators to discover yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {data.discoverUsers.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.username || profile.id}`}
                    className="glass rounded-2xl p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-semibold">
                          {(
                            profile.display_name ||
                            profile.username ||
                            "U"
                          )
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {profile.display_name ||
                            profile.username ||
                            "Anonymous"}
                        </div>

                        {profile.username && (
                          <div className="text-xs text-zinc-500">
                            @{profile.username}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-emerald-400">
                          {Number(profile.accuracy || 0).toFixed(0)}%
                        </div>

                        <div className="text-[10px] text-zinc-500">
                          accuracy
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <div className="text-sm font-semibold">
                          {profile.resolved_calls || 0}
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          Resolved
                        </div>
                      </div>

                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <div className="text-sm font-semibold">
                          {profile.active_calls || 0}
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          Active
                        </div>
                      </div>

                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <div className="text-sm font-semibold">
                          {profile.followers_count || 0}
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          Followers
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* VERIFIED TOKENS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />

              <h2 className="text-lg font-semibold">
                Verified Tokens
              </h2>
            </div>

            {data.verifiedTokens.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-sm text-zinc-500">
                No verified tokens yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {data.verifiedTokens.map((token) => (
                  <Link
                    key={`${token.network}:${token.contract_address}`}
                    href={tokenHref(token)}
                    className="glass rounded-2xl p-4 transition hover:bg-white/[0.05]"
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
                        <div className="text-xs capitalize text-zinc-500">
                          {token.network}
                        </div>

                        <div className="mt-1 font-mono text-[9px] text-zinc-600">
                          {shortAddress(token.contract_address)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
