"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, logout } = usePrivy();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("privy_id", user.id)
        .single();
      setProfile(data);
    }
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile</h1>
        <button
          onClick={logout}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Log out
        </button>
      </div>

      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
          <div>
            <div className="font-semibold text-lg">
              {profile?.display_name || user?.email?.address || "User"}
            </div>
            <div className="text-sm text-zinc-400">
              @{profile?.username || "username"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {profile?.accuracy?.toFixed(0) || 0}%
            </div>
            <div className="text-xs text-zinc-500">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {profile?.resolved_calls || 0}
            </div>
            <div className="text-xs text-zinc-500">Resolved</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{profile?.active_calls || 0}</div>
            <div className="text-xs text-zinc-500">Active</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-medium text-emerald-400">
              {profile?.hits || 0}
            </div>
            <div className="text-xs text-zinc-500">Hits</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-medium text-rose-400">
              {profile?.misses || 0}
            </div>
            <div className="text-xs text-zinc-500">Misses</div>
          </div>
        </div>
      </div>
    </div>
  );
}
