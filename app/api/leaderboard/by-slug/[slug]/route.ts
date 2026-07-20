import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/supabase';

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
      .select('slug,name,avatar_url,total_points,base_points,milestone_name,milestone_bonus,game_count,skill_count,trivia_count,saved_at,profile_url')
      .eq('slug', slug)
      .eq('hidden', false)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const { profile_url, avatar_url, total_points, base_points, milestone_name, milestone_bonus, game_count, skill_count, trivia_count, saved_at, ...rest } = data;
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
