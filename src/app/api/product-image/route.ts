import { NextRequest, NextResponse } from "next/server";

// Server-side Pexels image search proxy.
// Required env var (never exposed to the browser):
//   PEXELS_API_KEY  – free key from https://www.pexels.com/api/

const PEXELS_API_URL = "https://api.pexels.com/v1/search";

// Simple in-memory cache so repeated renders for the same product don't burn quota.
const cache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const cacheKey = query.toLowerCase();
  if (cache.has(cacheKey)) {
    return NextResponse.json({ imageUrl: cache.get(cacheKey) });
  }

  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Pexels API not configured" },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    query: `${query} food`,
    per_page: "1",
    orientation: "landscape",
  });

  const pexelsRes = await fetch(`${PEXELS_API_URL}?${params.toString()}`, {
    headers: { Authorization: apiKey },
    next: { revalidate: 86400 }, // cache for 24 hours
  });

  if (!pexelsRes.ok) {
    const text = await pexelsRes.text();
    return NextResponse.json(
      { error: `Pexels API error: ${text}` },
      { status: pexelsRes.status }
    );
  }

  const data = (await pexelsRes.json()) as {
    photos?: Array<{ src?: { large?: string } }>;
  };

  const imageUrl = data.photos?.[0]?.src?.large ?? null;

  if (!imageUrl) {
    return NextResponse.json({ imageUrl: null });
  }

  // Cache the result in memory (lives as long as the server process).
  if (cache.size > 500) cache.clear(); // prevent unbounded growth
  cache.set(cacheKey, imageUrl);

  return NextResponse.json({ imageUrl });
}
