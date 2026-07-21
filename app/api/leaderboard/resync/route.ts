import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/supabase';
import { fetchAndVerifyProfile } from '@/lib/serverUtils';

function isTimingSafeEqual(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

export async function POST(request: NextRequest) {
  const adminSecret = request.headers.get('x-admin-secret');
  if (!process.env.ADMIN_SECRET || !isTimingSafeEqual(adminSecret, process.env.ADMIN_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from('leaderboard')
    .select('id, slug, profile_url');

  if (error || !rows) {
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  const results: { slug: string; status: string; points?: number; skills?: number }[] = [];
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    if (!row.profile_url) {
      results.push({ slug: row.slug, status: 'skipped' });
      continue;
    }
    try {
      const { profile, stats } = await fetchAndVerifyProfile(row.profile_url, true);
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
        .eq('id', row.id);
      if (updateErr) throw updateErr;
      results.push({ slug: row.slug, status: 'updated', points: stats.totalPoints, skills: stats.counts['Skill Badge'] });
      updated++;
    } catch (err) {
      results.push({ slug: row.slug, status: `failed: ${err instanceof Error ? err.message : 'unknown'}` });
      failed++;
    }
    await new Promise(r => setTimeout(r, 800));
  }

  return NextResponse.json({ ok: true, updated, failed, total: rows.length, results });
}
