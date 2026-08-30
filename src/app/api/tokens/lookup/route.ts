import { NextRequest, NextResponse } from "next/server";
import { getTokenByAddress, getTokenInfo } from "@/lib/geckoterminal";

export async function GET(req: NextRequest) {
  const network = req.nextUrl.searchParams.get("network") || "solana";
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  try {
    const [token, info] = await Promise.all([
      getTokenByAddress(network, address),
      getTokenInfo(network, address),
    ]);

    if (!token?.data) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const attrs = token.data.attributes;
    return NextResponse.json({
      symbol: attrs.symbol,
      name: attrs.name || info?.data?.attributes?.name,
      address: attrs.address,
      price_usd: attrs.price_usd,
      image: info?.data?.attributes?.image_url || null,
      decimals: attrs.decimals,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Lookup failed" },
      { status: 500 }
    );
  }
}
