import { NextRequest, NextResponse } from "next/server";
import { getTokenByAddress, getTokenInfo } from "@/lib/geckoterminal";

export async function GET(req: NextRequest) {
  const network = req.nextUrl.searchParams.get("network") || "solana";
  const address = req.nextUrl.searchParams.get("address")?.trim();

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  try {
    const [tokenResult, infoResult] = await Promise.all([
      getTokenByAddress(network, address),
      getTokenInfo(network, address),
    ]);

    if (!tokenResult?.data) {
      return NextResponse.json(
        { error: "Token not found on this network" },
        { status: 404 }
      );
    }

    const attrs = tokenResult.data.attributes;
    const infoAttrs = infoResult?.data?.attributes;

    return NextResponse.json({
      network,
      symbol: attrs.symbol ?? infoAttrs?.symbol ?? "",
      name: attrs.name ?? infoAttrs?.name ?? "",
      address: attrs.address ?? address,
      price_usd: attrs.price_usd ?? null,
      image: infoAttrs?.image_url ?? null,
      decimals: attrs.decimals ?? null,
    });
  } catch (error) {
    console.error("Token lookup error:", error);

    return NextResponse.json(
      { error: "Failed to lookup token" },
      { status: 500 }
    );
  }
}
