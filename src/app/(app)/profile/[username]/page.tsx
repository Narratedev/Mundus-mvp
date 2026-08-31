"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatPct, calcPerformance } from "@/lib/utils";

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
  symbol: string;
  token_name: string | null;
  network: string;
  contract_address: string;
  direction: "bullish" | "bearish";
  entry_price: number;
  target_price: number;
  status: string;
  performance_pct: number | null;
  thesis: string;
  timeframe: string;
  created_at: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const identifier = String(params.username);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      let profileData: Profile | null = null;

      const byUsername = await supabase
        .from("profiles")
        .select("*")
        .eq("username", identifier)
        .maybeSingle();

      if (byUsername.data) {
        profileData = byUsername.data as Profile;
      } else {
        const byId = await supabase
          .from("profiles")
          .select("*")
          .eq("id", identifier)
          .maybeSingle();

        if (byId.data) {
          profileData = byId.data as Profile;
        }
      }

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: callsData } = await supabase
        .from("calls")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      const loadedCalls = (callsData || []) as Call[];
      setCalls(loadedCalls);

      const grouped: Record<string, string[]> = {};

      for (const call of loadedCalls) {
        if (!grouped[call.network]) {
          grouped[call.network] = [];
        }

        if (!grouped[call.network].includes(call.contract_address)) {
          grouped[call.network].push(call.contract_address);
        }
      }

      const nextPrices: Record<string, number> = {};

      await Promise.all(
        Object.entries(grouped).map(async ([network, addresses]) => {
          try {
            const res = await fetch(
              `/api/prices?network=${network}&addresses=${addresses.join(",")}`
            );

            const result = await res.json();

            for (const address of addresses) {
              const item = result?.data?.[address];

              const livePrice =
                item?.price ??
                item?.price_usd ??
                item?.attributes?.price_usd;

              if (livePrice) {
                nextPrices[address] = Number(livePrice);
              }
            }
          } catch {
            // Ignore individual price failures.
          }
        })
      );

      setPrices(nextPrices);
      setLoading(false);
    }

    loadProfile();
  }, [identifier]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass rounded-2xl p-10 text-center space-y-3">
        <h1 className="text-xl font-semibold">
          Profile not found
        </h1>

        <p className="text-sm text-zinc-500">
          This user doesn't exist or hasn't created a profile yet.
        </p>

        <Link
          href="/explore"
          className="inline-block text-sm text-indigo-400"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/home"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        ← Back
      </Link>

      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          )}

          <div>
            <h1 className="text-xl font-semibold">
              {profile.display_name || profile.username || "User"}
            </h1>

            <p className="text-sm text-zinc-500">
              @{profile.username || "user"}
            </p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-zinc-300">
            {profile.bio}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-emerald-400">
              {Number(profile.accuracy || 0).toFixed(0)}%
            </div>
            <div className="text-xs text-zinc-500">
              Accuracy
            </div>
          </div>

          <div>
            <div className="text-xl font-bold">
              {profile.resolved_calls || 0}
            </div>
            <div className="text-xs text-zinc-500">
              Resolved
            </div>
          </div>

          <div>
            <div className="text-xl font-bold">
              {profile.active_calls || 0}
            </div>
            <div className="text-xs text-zinc-500">
              Active
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="glass rounded-xl p-3">
            <div className="font-semibold text-emerald-400">
              {profile.hits || 0}
            </div>
            <div className="text-xs text-zinc-500">
              Hits
            </div>
          </div>

          <div className="glass rounded-xl p-3">
            <div className="font-semibold text-rose-400">
              {profile.misses || 0}
            </div>
            <div className="text-xs text-zinc-500">
              Misses
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Calls
        </h2>

        {calls.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-zinc-500">
            No calls yet.
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const current =
                prices[call.contract_address] ??
                Number(call.entry_price);

              const perf = calcPerformance(
                Number(call.entry_price),
                current,
                call.direction
              );

              return (
                <Link
                  key={call.id}
                  href={`/call/${call.id}`}
                  className="block glass rounded-2xl p-4 hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        ${call.symbol}
                      </div>

                      <div className="text-xs text-zinc-500">
                        {call.timeframe} ·{" "}
                        {new Date(
                          call.created_at
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    <div
                      className={
                        call.direction === "bullish"
                          ? "text-emerald-400 text-sm"
                          : "text-rose-400 text-sm"
                      }
                    >
                      {call.direction === "bullish"
                        ? "Bullish"
                        : "Bearish"}
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
                        {formatPrice(current)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-zinc-500">
                        Performance
                      </div>
                      <div
                        className={
                          perf >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }
                      >
                        {formatPct(perf)}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300 line-clamp-2">
                    {call.thesis}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
