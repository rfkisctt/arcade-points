import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('id');
  if (!courseId || !/^\d+$/.test(courseId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const cached = cache.get(courseId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ imageUrl: cached.url });
  }

  try {
    const url = `https://www.skills.google/course_templates/${courseId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArcadePoints/1.0)',
        'Accept': 'text/html',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return NextResponse.json({ imageUrl: null });

    const html = await res.text();

    const patterns = [
      /content="(https:\/\/cdn\.qwiklabs\.com\/[^"]+)"/g,
      /src="(https:\/\/cdn\.qwiklabs\.com\/[^"]+badge[^"]*)"/gi,
      /<meta[^>]+og:image[^>]+content="([^"]+)"/i,
      /content="([^"]+)"[^>]*property="og:image"/i,
    ];

    let imageUrl: string | null = null;

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match?.[1]) {
        const candidate = match[1];
        if (!candidate.includes('shapes-activities') && !candidate.includes('chip')) {
          imageUrl = candidate;
          break;
        }
      }
    }

    if (!imageUrl) {
      const cdnPattern = /https:\/\/cdn\.qwiklabs\.com\/[^"'\s]+/g;
      let m: RegExpExecArray | null;
      while ((m = cdnPattern.exec(html)) !== null) {
        const u = m[0];
        if (!u.includes('shapes-activities') && !u.includes('chip') && !u.includes('font') && !u.includes('material-icon')) {
          imageUrl = u;
          break;
        }
      }
    }

    if (imageUrl) cache.set(courseId, { url: imageUrl, ts: Date.now() });

    return NextResponse.json({ imageUrl: imageUrl ?? null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
