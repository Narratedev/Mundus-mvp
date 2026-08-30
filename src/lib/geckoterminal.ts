const BASE = "https://api.geckoterminal.com/api/v2";

export type Network = "solana" | "eth" | "base" | "bsc" | "arbitrum" | "polygon";

export async function searchPools(query: string, network?: string) {
  const params = new URLSearchParams({ query });
  if (network) params.set("network", network);
  const res = await fetch(`${BASE}/search/pools?${params}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("GeckoTerminal search failed");
  return res.json();
}

export async function getTokenByAddress(network: string, address: string) {
  const res = await fetch(`${BASE}/networks/${network}/tokens/${address}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("GeckoTerminal token fetch failed");
  }
  return res.json();
}

export async function getTokenPrice(network: string, addresses: string | string[]) {
  const addr = Array.isArray(addresses) ? addresses.join(",") : addresses;
  const res = await fetch(
    `${BASE}/simple/networks/${network}/token_price/${addr}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 15 },
    }
  );
  if (!res.ok) throw new Error("GeckoTerminal price failed");
  return res.json();
}

export async function getTrendingPools(network?: string) {
  const url = network
    ? `${BASE}/networks/${network}/trending_pools`
    : `${BASE}/networks/trending_pools`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error("GeckoTerminal trending failed");
  return res.json();
}

export async function getTokenInfo(network: string, address: string) {
  const res = await fetch(`${BASE}/networks/${network}/tokens/${address}/info`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}
