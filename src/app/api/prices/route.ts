import { NextRequest, NextResponse } from "next/server";
import { getTokenPrice } from "@/lib/geckoterminal";

export async function GET(req: NextRequest) {
  const network = req.nextUrl.searchParams.get("network") || "solana";
  const addresses = req.nextUrl.searchParams.get("addresses");

  if (!addresses) {
    return NextResponse.json({ error: "addresses required" }, { status: 400 });
  }

  try {
    const data = await getTokenPrice(network, addresses.split(","));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Price fetch failed" },
      { status: 500 }
    );
  }
}
