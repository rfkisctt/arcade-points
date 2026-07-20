import { NextRequest, NextResponse } from 'next/server';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const ALLOWED_HOSTNAMES = new Set([
  'cloudskillsboost.google',
  'www.cloudskillsboost.google',
  'skills.google',
  'www.skills.google',
]);

const ALLOWED_PATH_PREFIXES = [
  '/public_profiles/',
  '/profiles/',
];

function isValidProfileUrl(raw: string): boolean {
  let urlObj: URL;
  try {
    urlObj = new URL(raw);
  } catch {
    return false;
  }

  if (urlObj.protocol !== 'https:') return false;

  if (!ALLOWED_HOSTNAMES.has(urlObj.hostname)) return false;

  const validPath = ALLOWED_PATH_PREFIXES.some(p => urlObj.pathname.startsWith(p));
  if (!validPath) return false;

  if (urlObj.username || urlObj.password) return false;

  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Coba lagi dalam 1 menit.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 1024) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || !('url' in body)) {
    return NextResponse.json({ error: 'URL is required.' }, { status: 400 });
  }

  const url = (body as Record<string, unknown>).url;
  if (typeof url !== 'string' || url.length > 512) {
    return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
  }

  if (!isValidProfileUrl(url)) {
    return NextResponse.json(
      { error: 'URL tidak valid. Gunakan link public profile Google Cloud Skills Boost.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArcadePoints/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gagal mengambil profil (HTTP ${response.status}).` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'Response bukan HTML.' },
        { status: 502 }
      );
    }

    const html = await response.text();
    if (html.length > 5_000_000) {
      return NextResponse.json({ error: 'Response terlalu besar.' }, { status: 502 });
    }

    return NextResponse.json(
      { html },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Request timeout.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Gagal mengambil profil.' }, { status: 502 });
  }
}
