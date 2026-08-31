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
  const [tokenImage, setTokenImage] = useState<string | null>(null);

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
    if (!form.contract_address || form.contract_address.length < 20) return;

    setLookingUp(true);
    setError("");

    try {
      const lookupRes = await fetch(
        `/api/tokens/lookup?network=${form.network}&address=${form.contract_address.trim()}`
      );

      const token = await lookupRes.json();

      if (!lookupRes.ok || !token.symbol) {
        throw new Error("Token not found. Check the contract address.");
      }

      const priceRes = await fetch(
        `/api/prices?network=${form.network}&addresses=${form.contract_address.trim()}`
      );

      const priceData = await priceRes.json();

      const rawPrice =
        priceData?.data?.[form.contract_address.trim()]?.price ||
        priceData?.data?.[form.contract_address.trim()]?.price_usd;

      const tokenPrice = Number(rawPrice);

      if (!tokenPrice || tokenPrice <= 0) {
        throw new Error("Could not get a live price for this token.");
      }

      setPrice(tokenPrice);
      setTokenImage(token.image || null);

      setForm((f) => ({
        ...f,
        symbol: token.symbol,
        token_name: token.name || "",
      }));
    } catch (err: any) {
      setError(err.message || "Token lookup failed");
      setPrice(null);
      setTokenImage(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!price || price <= 0) {
      setError("Get the live token price before publishing.");
      return;
    }

    if (!form.target_price || Number(form.target_price) <= 0) {
      setError("Enter a valid target price.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const privyId = user?.id;

      if (!privyId) {
        throw new Error("Not authenticated");
      }

      // --------------------------------------------------
      // 1. Get or create the user's profile
      // --------------------------------------------------

      let { data: profile } = await supabase
        .from("profiles")
        .select("id, active_calls")
        .eq("privy_id", privyId)
        .maybeSingle();

      if (!profile) {
        const username =
          user?.email?.address?.split("@")[0] || `user_${Date.now()}`;

        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            privy_id: privyId,
            username,
            display_name: username,
          })
          .select("id, active_calls")
          .single();

        if (profileError) throw profileError;

        profile = newProfile;
      }

      // --------------------------------------------------
      // 2. Find the token in our verified token registry
      // --------------------------------------------------

      const address = form.contract_address.trim();

      const { data: existingToken, error: tokenLookupError } = await supabase
        .from("tokens")
        .select("id, is_verified")
        .eq("network", form.network)
        .eq("contract_address", address)
        .maybeSingle();

      if (tokenLookupError) {
        throw tokenLookupError;
      }

      let tokenId = existingToken?.id || null;

      // --------------------------------------------------
      // 3. If token isn't registered yet, create it
      // --------------------------------------------------

      if (!tokenId) {
        const { data: newToken, error: tokenInsertError } = await supabase
          .from("tokens")
          .insert({
            network: form.network,
            contract_address: address,
            symbol: form.symbol.toUpperCase(),
            name: form.token_name || form.symbol.toUpperCase(),
            image_url: tokenImage,
            is_verified: false,
          })
          .select("id")
          .single();

        if (tokenInsertError) {
          // Another request may have created it simultaneously.
          const { data: retryToken } = await supabase
            .from("tokens")
            .select("id")
            .eq("network", form.network)
            .eq("contract_address", address)
            .maybeSingle();

          if (!retryToken) throw tokenInsertError;

          tokenId = retryToken.id;
        } else {
          tokenId = newToken.id;
        }
      }

      // --------------------------------------------------
      // 4. Create the call and connect it to the token
      // --------------------------------------------------

      const { error: callError } = await supabase.from("calls").insert({
        user_id: profile.id,
        token_id: tokenId,
        network: form.network,
        contract_address: address,
        symbol: form.symbol.toUpperCase(),
        token_name: form.token_name,
        direction: form.direction,

        // Live price captured at publication.
        entry_price: price,

        target_price: Number(form.target_price),

        invalidation_price: form.invalidation_price
          ? Number(form.invalidation_price)
          : null,

        timeframe: form.timeframe,
        thesis: form.thesis.trim(),
        status: "active",
      });

      if (callError) throw callError;

      // --------------------------------------------------
      // 5. Increment active calls
      // --------------------------------------------------

      const currentActive = Number(profile.active_calls || 0);

      await supabase
        .from("profiles")
        .update({
          active_calls: currentActive + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      router.push("/home");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to publish call");
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
                setTokenImage(null);

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
              <option value="arbitrum">Arbitrum</option>
              <option value="polygon">Polygon</option>
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
              setTokenImage(null);

              setForm({
                ...form,
                contract_address: e.target.value,
              });
            }}
            onBlur={lookupToken}
            placeholder="Paste token contract address"
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none font-mono"
          />

          {lookingUp && (
            <p className="mt-2 text-xs text-zinc-500">
              Fetching token data and live price...
            </p>
          )}
        </div>

        {price !== null && (
          <div className="glass rounded-xl p-4">
            <div className="text-xs text-zinc-500">
              Live market price
            </div>

            <div className="text-2xl font-semibold mt-1">
              ${price < 0.01 ? price.toFixed(8) : price.toFixed(4)}
            </div>

            <div className="text-xs text-emerald-400 mt-1">
              This price will be locked as your entry price.
            </div>
          </div>
        )}

        {form.symbol && (
          <div className="glass rounded-xl p-3 flex items-center gap-3">
            {tokenImage ? (
              <img
                src={tokenImage}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10" />
            )}

            <div>
              <div className="font-semibold">
                {form.symbol}
              </div>

              <div className="text-xs text-zinc-500">
                {form.token_name}
              </div>
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
