"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user, logout } = usePrivy();
  const router = useRouter();

  const [profileId, setProfileId] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      const supabase = createClient();

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url")
        .eq("privy_id", user.id)
        .maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setProfileId(data.id);
        setUsername(data.username || "");
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [user?.id]);

  async function checkUsername() {
    const clean = username.trim().toLowerCase();

    if (!clean) {
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setUsernameAvailable(false);
      setError(
        "Username must be 3–20 characters and use only letters, numbers, or underscores."
      );
      return;
    }

    setCheckingUsername(true);
    setError("");
    setUsernameAvailable(null);

    try {
      const supabase = createClient();

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", clean)
        .maybeSingle();

      if (!data || data.id === profileId) {
        setUsernameAvailable(true);
      } else {
        setUsernameAvailable(false);
      }
    } catch {
      setError("Could not check username.");
    } finally {
      setCheckingUsername(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!profileId) {
      setError("Profile not found.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();
    const cleanAvatar = avatarUrl.trim();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError(
        "Username must be 3–20 characters and use only letters, numbers, or underscores."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existing && existing.id !== profileId) {
        setError("That username is already taken.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          display_name: cleanDisplayName || cleanUsername,
          bio: cleanBio || null,
          avatar_url: cleanAvatar || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (updateError) throw updateError;

      setUsername(cleanUsername);
      setUsernameAvailable(true);
      setMessage("Profile updated successfully.");

      router.refresh();
    } catch (err: any) {
      if (err?.code === "23505") {
        setError("That username is already taken.");
      } else {
        setError(err?.message || "Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your Mundus profile and account.
        </p>
      </div>

      <form onSubmit={saveProfile} className="space-y-5">
        <div className="glass rounded-2xl p-5 space-y-5">
          <h2 className="font-semibold">Profile</h2>

          <div>
            <label className="text-xs text-zinc-400">
              Username
            </label>

            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  @
                </span>

                <input
                  value={username}
                  maxLength={20}
                  onChange={(e) => {
                    setUsername(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                    );
                    setUsernameAvailable(null);
                  }}
                  placeholder="username"
                  className="w-full rounded-xl glass pl-8 pr-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={checkUsername}
                disabled={checkingUsername}
                className="rounded-xl bg-white/5 px-4 text-sm hover:bg-white/10 disabled:opacity-50"
              >
                {checkingUsername ? "Checking..." : "Check"}
              </button>
            </div>

            {usernameAvailable === true && (
              <p className="text-xs text-emerald-400 mt-2">
                Username is available.
              </p>
            )}

            {usernameAvailable === false && !error.includes("3–20") && (
              <p className="text-xs text-rose-400 mt-2">
                Username is already taken.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-zinc-400">
              Display name
            </label>

            <input
              value={displayName}
              maxLength={50}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">
              Bio
            </label>

            <textarea
              value={bio}
              maxLength={160}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people what you trade..."
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />

            <div className="text-right text-xs text-zinc-600 mt-1">
              {bio.length}/160
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">
              Avatar URL
            </label>

            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Account</h2>

          <div className="text-sm">
            <div className="text-xs text-zinc-500">
              Email
            </div>

            <div className="mt-1 text-zinc-300">
              {user?.email?.address || "Connected account"}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-indigo-500 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold mb-2">Session</h2>

        <p className="text-sm text-zinc-500 mb-4">
          Sign out of your Mundus account on this device.
        </p>

        <button
          onClick={logout}
          className="w-full rounded-full border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/5 transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
