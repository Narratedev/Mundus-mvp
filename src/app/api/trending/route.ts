import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createAdminClient();

    const { data: calls, error } = await supabase
      .from("calls")
      .select(`
        id,
        token_id,
        network,
        contract_address,
        symbol,
        token_name,
        agrees_count,
        disagrees_count,
        comments_count,
        created_at,
        tokens (
          id,
          symbol,
          name,
          network,
          contract_address,
          image_url,
          is_verified
        )
      `)
      .eq("tokens.is_verified", true)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Trending query error:", error);
      return NextResponse.json(
        { error: "Failed to load trending tokens" },
        { status: 500 }
      );
    }

    const now = Date.now();
    const tokenMap = new Map<string, {
      token: {
        id: string;
        symbol: string;
        name: string;
        network: string;
        contract_address: string;
        image_url: string | null;
        is_verified: boolean;
      };
      calls: number;
      agrees: number;
      disagrees: number;
      comments: number;
      score: number;
      latestCall: string;
    }>();

    for (const call of calls ?? []) {
      if (!call.token_id || !call.tokens) continue;

      const token = Array.isArray(call.tokens)
        ? call.tokens[0]
        : call.tokens;

      if (!token) continue;

      const ageHours =
        (now - new Date(call.created_at).getTime()) / (1000 * 60 * 60);

      const recencyMultiplier =
        ageHours <= 6
          ? 3
          : ageHours <= 24
            ? 2
            : ageHours <= 72
              ? 1.5
              : ageHours <= 168
                ? 1
                : 0.5;

      const callScore =
        (40 +
          (call.agrees_count ?? 0) * 2 +
          (call.disagrees_count ?? 0) +
          (call.comments_count ?? 0) * 3) *
        recencyMultiplier;

      const existing = tokenMap.get(call.token_id);

      if (existing) {
        existing.calls += 1;
        existing.agrees += call.agrees_count ?? 0;
        existing.disagrees += call.disagrees_count ?? 0;
        existing.comments += call.comments_count ?? 0;
        existing.score += callScore;

        if (
          new Date(call.created_at).getTime() >
          new Date(existing.latestCall).getTime()
        ) {
          existing.latestCall = call.created_at;
        }
      } else {
        tokenMap.set(call.token_id, {
          token,
          calls: 1,
          agrees: call.agrees_count ?? 0,
          disagrees: call.disagrees_count ?? 0,
          comments: call.comments_count ?? 0,
          score: callScore,
          latestCall: call.created_at,
        });
      }
    }

    const trending = Array.from(tokenMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return NextResponse.json({
      tokens: trending,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
