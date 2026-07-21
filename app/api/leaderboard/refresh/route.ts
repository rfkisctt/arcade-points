import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchAndVerifyProfile } from '@/lib/serverUtils';

const refreshMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const slug = typeof (body as Record<string, unknown>).slug === 'string'
    ? ((body as Record<string, unknown>).slug as string).trim()
    : '';

  if (!slug || !/^[a-z0-9]{8,22}$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
  }

  const key = `${slug}:${ip}`;
  const now = Date.now();
  if (now - (refreshMap.get(key) ?? 0) < 10 * 60 * 1000) {
    return NextResponse.json({ error: 'Rate limited.', cached: true }, { status: 429 });
  }
  refreshMap.set(key, now);

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, profile_url')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data?.profile_url) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    const { profile, stats } = await fetchAndVerifyProfile(data.profile_url, true);

    const { error: updateErr } = await supabase
      .from('leaderboard')
      .update({
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
      })
      .eq('id', data.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      ok: true,
      totalPoints: stats.totalPoints,
      skillCount: stats.counts['Skill Badge'],
      gameCount: stats.counts.Game,
      milestoneName: stats.currentMilestone.name,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
