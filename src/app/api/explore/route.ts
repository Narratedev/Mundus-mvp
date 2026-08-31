import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      { data: calls, error: callsError },
      { data: profiles, error: profilesError },
      { data: tokens, error: tokensError },
    ] = await Promise.all([
      supabase
        .from("calls")
        .select(`
          id,
          user_id,
          token_id,
          network,
          contract_address,
          symbol,
          token_name,
          direction,
          entry_price,
          target_price,
          status,
          performance_pct,
          thesis,
          timeframe,
          created_at,
          agrees_count,
          disagrees_count,
          comments_count,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            accuracy,
            resolved_calls
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50),

      supabase
        .from("profiles")
        .select(`
          id,
          username,
          display_name,
          avatar_url,
          bio,
          accuracy,
          resolved_calls,
          hits,
          misses,
          active_calls,
          followers_count,
          following_count
        `)
        .order("accuracy", { ascending: false })
        .limit(30),

      supabase
        .from("tokens")
        .select(`
          id,
          network,
          contract_address,
          symbol,
          name,
          image_url,
          decimals,
          is_verified
        `)
        .eq("is_verified", true)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (callsError) throw callsError;
    if (profilesError) throw profilesError;
    if (tokensError) throw tokensError;

    const callRows = calls ?? [];

    /*
     * Build token activity from actual Mundus calls.
     */
    const activity = new Map<
      string,
      {
        calls: number;
        agrees: number;
        disagrees: number;
        comments: number;
      }
    >();

    for (const call of callRows) {
      const key = `${call.network}:${call.contract_address}`;

      const current = activity.get(key) ?? {
        calls: 0,
        agrees: 0,
        disagrees: 0,
        comments: 0,
      };

      current.calls += 1;
      current.agrees += Number(call.agrees_count ?? 0);
      current.disagrees += Number(call.disagrees_count ?? 0);
      current.comments += Number(call.comments_count ?? 0);

      activity.set(key, current);
    }

    /*
     * Match tokens to activity and calculate a simple
     * Mundus discovery score.
     */
    const tokenMap = new Map(
      (tokens ?? []).map((token) => [
        `${token.network}:${token.contract_address}`,
        token,
      ])
    );

    const trending = Array.from(activity.entries())
      .map(([key, stats]) => {
        const token = tokenMap.get(key);

        if (!token) return null;

        const score =
          stats.calls * 5 +
          stats.agrees * 3 +
          stats.disagrees * 2 +
          stats.comments * 4;

        return {
          token,
          ...stats,
          score,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 10);

    /*
     * Calls with the most engagement.
     */
    const trendingCalls = [...callRows]
      .map((call) => ({
        ...call,
        engagement:
          Number(call.agrees_count ?? 0) +
          Number(call.disagrees_count ?? 0) +
          Number(call.comments_count ?? 0),
      }))
      .sort((a, b) => {
        if (b.engagement !== a.engagement) {
          return b.engagement - a.engagement;
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      })
      .slice(0, 10);

    /*
     * Discover people who have actually made calls.
     */
    const activeUserIds = new Set(
      callRows.map((call) => call.user_id)
    );

    const discoverUsers = (profiles ?? [])
      .filter((profile) => activeUserIds.has(profile.id))
      .sort((a, b) => {
        const aScore =
          Number(a.accuracy ?? 0) * 2 +
          Number(a.resolved_calls ?? 0) +
          Number(a.followers_count ?? 0);

        const bScore =
          Number(b.accuracy ?? 0) * 2 +
          Number(b.resolved_calls ?? 0) +
          Number(b.followers_count ?? 0);

        return bScore - aScore;
      })
      .slice(0, 10);

    return NextResponse.json({
      trendingTokens: trending,
      trendingCalls,
      discoverUsers,
      verifiedTokens: tokens ?? [],
    });
  } catch (error) {
    console.error("Explore API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load Explore",
      },
      { status: 500 }
    );
  }
}
