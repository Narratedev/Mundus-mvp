"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function ExplorePage() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Explore</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tokens or users…"
          className="w-full rounded-xl glass pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="glass rounded-2xl p-6 text-center text-zinc-400 text-sm">
        Trending tokens, community sentiment and recent calls will appear here.
        Search uses GeckoTerminal + Supabase profiles.
      </div>
    </div>
  );
}
