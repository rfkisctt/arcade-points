import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/supabase';
import { fetchAndVerifyProfile } from '@/lib/serverUtils';

function isTimingSafeEqual(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

const postRateMap = new Map<string, { count: number; resetAt: number }>();
function checkPostRate(ip: string): boolean {
  const now = Date.now();
  const e = postRateMap.get(ip);
  if (!e || now > e.resetAt) { postRateMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (e.count >= 5) return false;
  e.count++; return true;
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(22);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

function validateEntry(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const o = e as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id.length > 512) return false;
  if (typeof o.name !== 'string' || o.name.length > 200) return false;
  if (typeof o.totalPoints !== 'number' || o.totalPoints < 0 || o.totalPoints > 10000) return false;
  if (typeof o.basePoints !== 'number' || o.basePoints < 0 || o.basePoints > 10000) return false;
  if (typeof o.gameCount !== 'number' || o.gameCount < 0 || o.gameCount > 1000) return false;
  if (typeof o.skillCount !== 'number' || o.skillCount < 0 || o.skillCount > 10000) return false;
  if (typeof o.triviaCount !== 'number' || o.triviaCount < 0 || o.triviaCount > 1000) return false;
  if (o.profileUrl !== undefined && typeof o.profileUrl === 'string') {
    try {
      const u = new URL(o.profileUrl as string);
      const allowed = ['skills.google', 'www.skills.google', 'cloudskillsboost.google', 'www.cloudskillsboost.google'];
      if (u.protocol !== 'https:' || !allowed.includes(u.hostname)) return false;
    } catch { return false; }
  }
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    const isAdmin = !!process.env.ADMIN_SECRET && isTimingSafeEqual(adminSecret, process.env.ADMIN_SECRET);

    let query = supabase
      .from('leaderboard')
      .select('slug,name,avatar_url,total_points,base_points,milestone_name,milestone_bonus,game_count,skill_count,trivia_count,saved_at,hidden')
      .order('total_points', { ascending: false });

    if (!isAdmin) query = query.eq('hidden', false);

    const { data, error } = await query;
    if (error) throw error;

    const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
      slug:           r.slug,
      name:           r.name,
      avatarUrl:      r.avatar_url,
      totalPoints:    r.total_points,
      basePoints:     r.base_points,
      milestoneName:  r.milestone_name,
      milestoneBonus: r.milestone_bonus,
      gameCount:      r.game_count,
      skillCount:     r.skill_count,
      triviaCount:    r.trivia_count,
      savedAt:        r.saved_at,
      hidden:         isAdmin ? (r.hidden ?? false) : undefined,
    }));

    return NextResponse.json(mapped, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json([], { headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkPostRate(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 2048) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const profileUrl = typeof input.profileUrl === 'string' ? input.profileUrl.trim() : '';
  const hasExtraBonus = input.hasExtraBonus === true;

  if (!profileUrl) {
    return NextResponse.json({ error: 'profileUrl is required.' }, { status: 400 });
  }

  try {
    const { profile, stats } = await fetchAndVerifyProfile(profileUrl, hasExtraBonus);

    const { data: existing } = await supabase
      .from('leaderboard')
      .select('slug, owner_token, hidden')
      .eq('id', profileUrl)
      .maybeSingle();

    const slug = existing?.slug || generateToken();
    const ownerToken = existing?.owner_token || generateToken();
    const hidden = existing ? (existing.hidden ?? false) : false;

    const row = {
      id:              profileUrl,
      slug,
      owner_token:     ownerToken,
      name:            profile.name.trim().slice(0, 100),
      avatar_url:      profile.avatarUrl || '',
      total_points:    stats.totalPoints,
      base_points:     stats.basePoints,
      milestone_name:  stats.currentMilestone.name.slice(0, 50),
      milestone_bonus: stats.currentMilestone.bonus,
      game_count:      stats.counts.Game,
      skill_count:     stats.counts['Skill Badge'],
      trivia_count:    stats.counts.Trivia,
      profile_url:     profileUrl,
      saved_at:        Date.now(),
      hidden,
    };

    const { error } = await supabase.from('leaderboard').upsert(row, { onConflict: 'id' });
    if (error) throw error;

    return NextResponse.json({ ok: true, slug, ownerToken, profile, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Server error.';
    const isUserError = msg.includes('tidak valid') || msg.includes('PRIVATE') || msg.includes('404') || msg.includes('badge') || msg.includes('timeout') || msg.includes('Gagal');
    return NextResponse.json({ error: msg }, { status: isUserError ? 422 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    const adminSecret = request.headers.get('x-admin-secret');
    const isAdmin = !!process.env.ADMIN_SECRET && isTimingSafeEqual(adminSecret, process.env.ADMIN_SECRET);

    if (!id) {
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      await supabase.from('leaderboard').delete().neq('id', '');
      return NextResponse.json({ ok: true });
    }

    if (typeof id !== 'string' || id.length > 512) {
      return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
    }

    if (!isAdmin) {
      const ownerToken = request.headers.get('x-owner-token');
      if (!ownerToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

      const { data: row } = await supabase
        .from('leaderboard')
        .select('owner_token')
        .eq('id', id)
        .maybeSingle();

      if (!row?.owner_token || !isTimingSafeEqual(row.owner_token, ownerToken)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
    }

    await supabase.from('leaderboard').delete().eq('id', id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
