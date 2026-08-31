"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

export default function PostCallPage() {
  const { user } = usePrivy();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState("");
  const [price, setPrice] = useState<number | null>(null);

  const [form, setForm] = useState({
    network: "solana",
    contract_address: "",
    symbol: "",
    token_name: "",
    direction: "bullish" as "bullish" | "bearish",
    target_price: "",
    invalidation_price: "",
    timeframe: "1w",
    thesis: "",
  });

  async function lookupToken() {
    const address = form.contract_address.trim();

    if (!address || address.length < 20) return;

    setLookingUp(true);
    setError("");
    setPrice(null);

    try {
      const lookupRes = await fetch(
        `/api/tokens/lookup?network=${form.network}&address=${encodeURIComponent(address)}`
      );

      const token = await lookupRes.json();

      if (!lookupRes.ok || !token?.symbol) {
        throw new Error("Token not found. Check the contract address.");
      }

      const priceRes = await fetch(
        `/api/prices?network=${form.network}&addresses=${encodeURIComponent(address)}`
      );

      const priceData = await priceRes.json();

      if (!priceRes.ok) {
        throw new Error(
          priceData?.error || "Could not fetch the live token price."
        );
      }

      const rawPrice =
        priceData?.data?.[address]?.price ??
        priceData?.data?.[address]?.price_usd ??
        token?.price_usd;

      const tokenPrice = Number(rawPrice);

      if (!Number.isFinite(tokenPrice) || tokenPrice <= 0) {
        throw new Error("Could not get a live price for this token.");
      }

      setPrice(tokenPrice);

      setForm((f) => ({
        ...f,
        contract_address: address,
        symbol: token.symbol,
        token_name: token.name || "",
      }));
    } catch (err: any) {
      setError(err?.message || "Token lookup failed");
      setPrice(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!user?.id) {
      setError("Not authenticated.");
      return;
    }

    if (!price || price <= 0) {
      setError("Get the live token price before publishing.");
      return;
    }

    const targetPrice = Number(form.target_price);

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      setError("Enter a valid target price.");
      return;
    }

    if (
      form.invalidation_price &&
      (!Number.isFinite(Number(form.invalidation_price)) ||
        Number(form.invalidation_price) <= 0)
    ) {
      setError("Enter a valid invalidation price.");
      return;
    }

    if (!form.thesis.trim()) {
      setError("Write a thesis for your call.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const privyId = user.id;

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("privy_id", privyId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      if (!profile) {
        const baseUsername =
          user?.email?.address?.split("@")[0] || `user_${Date.now()}`;

        const { data: newProfile, error: createProfileError } =
          await supabase
            .from("profiles")
            .insert({
              privy_id: privyId,
              username: baseUsername,
              display_name: baseUsername,
            })
            .select("id")
            .single();

        if (createProfileError) {
          throw createProfileError;
        }

        profile = newProfile;
      }

      const address = form.contract_address.trim();

      /*
       * Capture the market price at the exact moment the call is published.
       * The user never manually enters an entry price.
       */
      const { error: callError } = await supabase.from("calls").insert({
        user_id: profile.id,
        network: form.network,
        contract_address: address,
        symbol: form.symbol.toUpperCase(),
        token_name: form.token_name || null,
        direction: form.direction,
        entry_price: price,
        target_price: targetPrice,
        invalidation_price: form.invalidation_price
          ? Number(form.invalidation_price)
          : null,
        timeframe: form.timeframe,
        thesis: form.thesis.trim(),
        status: "active",
      });

      if (callError) {
        throw callError;
      }

      /*
       * active_calls is intentionally NOT incremented here.
       * We'll handle profile statistics at the database level so
       * counts cannot become inconsistent.
       */

      router.push("/home");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to publish call");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Make a Call</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Network</label>

            <select
              value={form.network}
              onChange={(e) => {
                setPrice(null);
                setError("");

                setForm({
                  ...form,
                  network: e.target.value,
                  contract_address: "",
                  symbol: "",
                  token_name: "",
                });
              }}
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
            >
              <option value="solana">Solana</option>
              <option value="eth">Ethereum</option>
              <option value="base">Base</option>
              <option value="bsc">BSC</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Direction</label>

            <select
              value={form.direction}
              onChange={(e) =>
                setForm({
                  ...form,
                  direction: e.target.value as "bullish" | "bearish",
                })
              }
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
            >
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400">
            Contract Address
          </label>

          <input
            required
            value={form.contract_address}
            onChange={(e) => {
              setPrice(null);
              setError("");

              setForm({
                ...form,
                contract_address: e.target.value,
                symbol: "",
                token_name: "",
              });
            }}
            onBlur={lookupToken}
            placeholder="Paste token contract address"
            className="mt-1 w-full rounded-xl glass pl-3 pr-3 py-2.5 text-sm outline-none font-mono"
          />

          {lookingUp && (
            <p className="mt-2 text-xs text-zinc-500">
              Fetching token data and live price...
            </p>
          )}
        </div>

        {form.symbol && (
          <div className="glass rounded-xl p-3">
            <div className="text-xs text-zinc-500">Token</div>

            <div className="font-semibold">
              {form.symbol}
            </div>

            <div className="text-xs text-zinc-500">
              {form.token_name}
            </div>
          </div>
        )}

        {price !== null && (
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-zinc-500">
              Live market price
            </div>

            <div className="text-2xl font-semibold mt-1">
              $
              {price < 0.01
                ? price.toFixed(8)
                : price.toFixed(4)}
            </div>

            <div className="text-xs text-emerald-400 mt-1">
              This price will be locked as your entry price when published.
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-zinc-400">
            Target $
          </label>

          <input
            required
            type="number"
            step="any"
            min="0"
            value={form.target_price}
            onChange={(e) =>
              setForm({
                ...form,
                target_price: e.target.value,
              })
            }
            placeholder="Target price"
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400">
            Invalidation $
          </label>

          <input
            type="number"
            step="any"
            min="0"
            value={form.invalidation_price}
            onChange={(e) =>
              setForm({
                ...form,
                invalidation_price: e.target.value,
              })
            }
            placeholder="Optional"
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400">
            Timeframe
          </label>

          <select
            value={form.timeframe}
            onChange={(e) =>
              setForm({
                ...form,
                timeframe: e.target.value,
              })
            }
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none"
          >
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="2w">2 Weeks</option>
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-400">
            Thesis
          </label>

          <textarea
            required
            rows={4}
            value={form.thesis}
            onChange={(e) =>
              setForm({
                ...form,
                thesis: e.target.value,
              })
            }
            placeholder="Why this call? What's your edge?"
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || lookingUp || !price}
          className="w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Call"}
        </button>
      </form>
    </div>
  );
}
