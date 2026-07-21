import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, { url: string; badgeType: string | null; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('id');
  if (!courseId || !/^\d+$/.test(courseId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const cached = cache.get(courseId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ imageUrl: cached.url, badgeType: cached.badgeType });
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

    if (!res.ok) return NextResponse.json({ imageUrl: null, badgeType: null });

    const html = await res.text();
    const lower = html.toLowerCase();

    // Detect badge type from page content
    // Skills Boost uses "completion_badge" or "skill_badge" in their JSON/data
    let badgeType: string | null = null;
    if (lower.includes('"completion_badge"') || lower.includes('completion-badge') ||
        lower.includes('"completion badge"') || lower.includes("'completion_badge'")) {
      badgeType = 'completion';
    } else if (lower.includes('"skill_badge"') || lower.includes('skill-badge') ||
               lower.includes('"skill badge"') || lower.includes("'skill_badge'")) {
      badgeType = 'skill';
    }

    // Also check for "Completion Badge" text in visible content (like og:description)
    if (!badgeType) {
      const completionMatch = /completion badge/i.test(html);
      const skillMatch = /skill badge/i.test(html);
      if (completionMatch && !skillMatch) badgeType = 'completion';
      else if (skillMatch) badgeType = 'skill';
    }

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

    if (imageUrl || badgeType) {
      cache.set(courseId, { url: imageUrl ?? '', badgeType, ts: Date.now() });
    }

    return NextResponse.json({ imageUrl: imageUrl ?? null, badgeType });
  } catch {
    return NextResponse.json({ imageUrl: null, badgeType: null });
  }
}
