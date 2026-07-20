import { NextResponse } from "next/server";

export const revalidate = 3600; // cache 1 jam

export async function GET() {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch("https://api.github.com/repos/rfkisctt/arcade-points", {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ stars: null });
    const data = await res.json();
    return NextResponse.json({ stars: data.stargazers_count ?? null });
  } catch {
    return NextResponse.json({ stars: null });
  }
}
