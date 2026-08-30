"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

export default function PostCallPage() {
  const { user } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    network: "solana",
    contract_address: "",
    symbol: "",
    token_name: "",
    direction: "bullish" as "bullish" | "bearish",
    entry_price: "",
    target_price: "",
    invalidation_price: "",
    timeframe: "1w",
    thesis: "",
  });

  async function lookupToken() {
    if (!form.contract_address || form.contract_address.length < 20) return;
    try {
      const res = await fetch(
        `/api/tokens/lookup?network=${form.network}&address=${form.contract_address}`
      );
      const data = await res.json();
      if (data.symbol) {
        setForm((f) => ({
          ...f,
          symbol: data.symbol,
          token_name: data.name || "",
        }));
      }
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      // Ensure profile exists (sync from Privy)
      const privyId = user?.id;
      if (!privyId) throw new Error("Not authenticated");

      let { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("privy_id", privyId)
        .single();

      if (!profile) {
        const { data: newProfile, error: pErr } = await supabase
          .from("profiles")
          .insert({
            privy_id: privyId,
            username: user?.email?.address?.split("@")[0] || `user_${Date.now()}`,
            display_name: user?.email?.address?.split("@")[0] || "User",
          })
          .select("id")
          .single();
        if (pErr) throw pErr;
        profile = newProfile;
      }

      const { error: cErr } = await supabase.from("calls").insert({
        user_id: profile!.id,
        network: form.network,
        contract_address: form.contract_address,
        symbol: form.symbol.toUpperCase(),
        token_name: form.token_name,
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        target_price: parseFloat(form.target_price),
        invalidation_price: form.invalidation_price
          ? parseFloat(form.invalidation_price)
          : null,
        timeframe: form.timeframe,
        thesis: form.thesis,
        status: "active",
      });

      if (cErr) throw cErr;
      router.push("/home");
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
              onChange={(e) => setForm({ ...form, network: e.target.value })}
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400">
            Contract Address (or search ticker later)
          </label>
          <input
            required
            value={form.contract_address}
            onChange={(e) =>
              setForm({ ...form, contract_address: e.target.value })
            }
            onBlur={lookupToken}
            placeholder="Token contract address"
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Symbol</label>
            <input
              required
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              placeholder="SOL"
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Name</label>
            <input
              value={form.token_name}
              onChange={(e) => setForm({ ...form, token_name: e.target.value })}
              placeholder="Solana"
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-zinc-400">Entry $</label>
            <input
              required
              type="number"
              step="any"
              value={form.entry_price}
              onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Target $</label>
            <input
              required
              type="number"
              step="any"
              value={form.target_price}
              onChange={(e) =>
                setForm({ ...form, target_price: e.target.value })
              }
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Invalidation $</label>
            <input
              type="number"
              step="any"
              value={form.invalidation_price}
              onChange={(e) =>
                setForm({ ...form, invalidation_price: e.target.value })
              }
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Timeframe</label>
          <select
            value={form.timeframe}
            onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="2w">2 Weeks</option>
            <option value="1m">1 Month</option>
            <option value="3m">3 Months</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Thesis</label>
          <textarea
            required
            rows={4}
            value={form.thesis}
            onChange={(e) => setForm({ ...form, thesis: e.target.value })}
            placeholder="Why this call? What's your edge?"
            className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50 transition"
        >
          {loading ? "Publishing…" : "Publish Call"}
        </button>
      </form>
    </div>
  );
}
