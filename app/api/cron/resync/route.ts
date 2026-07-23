import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchAndVerifyProfile } from '@/lib/serverUtils';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from('leaderboard')
    .select('id, slug, profile_url')
    .not('profile_url', 'is', null);

  if (error || !rows) {
    return NextResponse.json({ error: 'DB error.' }, { status: 500 });
  }

  let updated = 0;
  let failed = 0;
  const results: { slug: string; status: string; points?: number; skills?: number }[] = [];

  for (const row of rows) {
    if (!row.profile_url) continue;
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
      results.push({ slug: row.slug, status: 'updated', points: stats.totalPoints, skills: stats.counts['Skill Badge'] + (stats.counts['Completion Badge'] ?? 0) });
      updated++;
    } catch (err) {
      results.push({ slug: row.slug, status: `failed: ${err instanceof Error ? err.message : 'unknown'}` });
      failed++;
    }

    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`[cron/resync] updated=${updated} failed=${failed} total=${rows.length}`);

  return NextResponse.json({
    ok: true,
    updated,
    failed,
    total: rows.length,
    results,
  });
}
