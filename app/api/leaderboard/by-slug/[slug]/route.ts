import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/supabase';
import { fetchAndVerifyProfile } from '@/lib/serverUtils';

function isTimingSafeEqual(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now > e.resetAt) { rateMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (e.count >= 30) return false;
  e.count++; return true;
}

const STALE_MS = 30 * 60 * 1000; // 30 menit

async function backgroundResync(id: string, profileUrl: string) {
  try {
    const { profile, stats } = await fetchAndVerifyProfile(profileUrl, true);
    await supabase.from('leaderboard').update({
      name:            profile.name.trim().slice(0, 100),
      avatar_url:      profile.avatarUrl || '',
      total_points:    stats.totalPoints,
      base_points:     stats.basePoints,
      milestone_name:  stats.currentMilestone.name.slice(0, 50),
      milestone_bonus: stats.currentMilestone.bonus,
      game_count:      stats.counts.Game,
      skill_count:     stats.counts['Skill Badge'],
      trivia_count:    stats.counts.Trivia,
      saved_at:        Date.now(),
    }).eq('id', id);
  } catch {
  }
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
      .select('slug,name,avatar_url,total_points,base_points,milestone_name,milestone_bonus,game_count,skill_count,trivia_count,saved_at,profile_url,id')
      .eq('slug', slug)
      .eq('hidden', false)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const isStale = !data.saved_at || (Date.now() - data.saved_at) > STALE_MS;
    if (isStale && data.profile_url && data.id) {
      const resyncPromise = backgroundResync(data.id, data.profile_url);
      if (typeof globalThis !== "undefined" && (globalThis as unknown as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil) {
        (globalThis as unknown as { waitUntil: (p: Promise<unknown>) => void }).waitUntil(resyncPromise);
      }
    }

    const { profile_url, id, avatar_url, total_points, base_points, milestone_name, milestone_bonus, game_count, skill_count, trivia_count, saved_at, ...rest } = data;
    return NextResponse.json(
      {
        ...rest,
        avatarUrl:      avatar_url,
        totalPoints:    total_points,
        basePoints:     base_points,
        milestoneName:  milestone_name,
        milestoneBonus: milestone_bonus,
        gameCount:      game_count,
        skillCount:     skill_count,
        triviaCount:    trivia_count,
        savedAt:        saved_at,
        hasProfile:     !!profile_url,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  if (!slug || !/^[a-z0-9]{8,22}$/.test(slug)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const secret = req.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || !isTimingSafeEqual(secret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .from('leaderboard')
      .update({ hidden: true })
      .eq('slug', slug);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
