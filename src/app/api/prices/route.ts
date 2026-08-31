import { NextRequest, NextResponse } from "next/server";
import { getTokenPrice } from "@/lib/geckoterminal";

export async function GET(req: NextRequest) {
  const network = req.nextUrl.searchParams.get("network");
  const address =
    req.nextUrl.searchParams.get("addresses") ||
    req.nextUrl.searchParams.get("address");

  if (!network || !address) {
    return NextResponse.json(
      { error: "network and address are required" },
      { status: 400 }
    );
  }

  try {
    const result = await getTokenPrice(network, address);

    const raw = result?.data ?? {};

    const firstEntry = Object.values(raw)[0] as
      | {
          price?: string | number;
        }
      | undefined;

    const price =
      firstEntry?.price !== undefined
        ? Number(firstEntry.price)
        : null;

    return NextResponse.json({
      price,
    });
  } catch (error) {
    console.error("Price API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch token price" },
      { status: 500 }
    );
  }
}
