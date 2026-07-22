import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchAndVerifyProfile } from '@/lib/serverUtils';

const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now > e.resetAt) { rateMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (e.count >= 15) return false;
  e.count++; return true;
}

const ALLOWED = new Set([
  'skills.google', 'www.skills.google',
  'cloudskillsboost.google', 'www.cloudskillsboost.google',
]);

function isValidGoogleUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED.has(u.hostname);
  } catch { return false; }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRate(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const { slug } = params;
  if (!slug || !/^[a-z0-9]{8,22}$/.test(slug)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('profile_url')
      .eq('slug', slug)
      .eq('hidden', false)
      .maybeSingle();

    if (error || !data?.profile_url) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const profileUrl: string = data.profile_url;
    if (!isValidGoogleUrl(profileUrl)) {
      return NextResponse.json({ error: 'Invalid profile URL.' }, { status: 400 });
    }

    const { profile } = await fetchAndVerifyProfile(profileUrl, true);

    return NextResponse.json(
      { profile },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Request timeout.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
