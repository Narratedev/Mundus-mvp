"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, logout } = usePrivy();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;

      const supabase = createClient();

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("privy_id", user.id)
        .maybeSingle();

      setProfile(data);
      setLoading(false);
    }

    load();
  }, [user?.id]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  const displayName =
    profile?.display_name ||
    user?.email?.address?.split("@")[0] ||
    "User";

  const username = profile?.username || "username";

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile</h1>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Profile menu"
            aria-expanded={menuOpen}
            className="h-10 w-10 rounded-xl glass flex items-center justify-center text-lg text-zinc-300 hover:bg-white/10 transition"
          >
            =
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-sm font-medium truncate">
                  {displayName}
                </div>

                <div className="text-xs text-zinc-500 truncate">
                  @{username}
                </div>
              </div>

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 transition"
              >
                Edit Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:bg-white/5 transition border-t border-white/5"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PROFILE CARD */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xl font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="font-semibold text-lg truncate">
              {displayName}
            </div>

            <div className="text-sm text-zinc-400 truncate">
              @{username}
            </div>

            {profile?.bio && (
              <p className="text-sm text-zinc-500 mt-2">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400">
              {Number(profile?.accuracy || 0).toFixed(0)}%
            </div>

            <div className="text-xs text-zinc-500">
              Accuracy
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold">
              {profile?.resolved_calls || 0}
            </div>

            <div className="text-xs text-zinc-500">
              Resolved
            </div>
          </div>

          <div>
            <div className="text-2xl font-bold">
              {profile?.active_calls || 0}
            </div>

            <div className="text-xs text-zinc-500">
              Active
            </div>
          </div>
        </div>

        {/* RECORD */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-medium text-emerald-400">
              {profile?.hits || 0}
            </div>

            <div className="text-xs text-zinc-500">
              Hits
            </div>
          </div>

          <div className="glass rounded-xl p-3 text-center">
            <div className="font-medium text-rose-400">
              {profile?.misses || 0}
            </div>

            <div className="text-xs text-zinc-500">
              Misses
            </div>
          </div>
        </div>

        {/* FOLLOWING */}
        <div className="grid grid-cols-2 gap-3 text-center pt-1">
          <div>
            <div className="font-semibold">
              {profile?.followers_count || 0}
            </div>

            <div className="text-xs text-zinc-500">
              Followers
            </div>
          </div>

          <div>
            <div className="font-semibold">
              {profile?.following_count || 0}
            </div>

            <div className="text-xs text-zinc-500">
              Following
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
