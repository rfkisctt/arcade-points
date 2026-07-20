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
  if (e.count >= 5) return false;
  e.count++; return true;
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRate(ip)) {
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

  const { id, hidden, slug: bodySlug } = (body ?? {}) as Record<string, unknown>;

  const hasId = typeof id === 'string' && id.length > 0 && id.length <= 512;
  const hasSlug = typeof bodySlug === 'string' && bodySlug.length > 0 && bodySlug.length <= 22;

  if (!hasId && !hasSlug) {
    return NextResponse.json({ error: 'Invalid id or slug.' }, { status: 400 });
  }
  if (typeof hidden !== 'boolean') {
    return NextResponse.json({ error: 'hidden must be boolean.' }, { status: 400 });
  }

  const adminSecret = request.headers.get('x-admin-secret');
  const ownerToken = request.headers.get('x-owner-token');
  const isAdmin = !!process.env.ADMIN_SECRET && !!adminSecret && isTimingSafeEqual(adminSecret, process.env.ADMIN_SECRET);

  if (!isAdmin) {
    if (!hasId) {
      return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
    }
    if (!ownerToken) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data: row } = await supabase
      .from('leaderboard')
      .select('owner_token')
      .eq('id', id)
      .maybeSingle();

    const dbToken: string | null = row?.owner_token ?? null;
    if (!dbToken || !isTimingSafeEqual(dbToken, ownerToken)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  try {
    let updateQuery = supabase.from('leaderboard').update({ hidden });
    updateQuery = isAdmin && hasSlug
      ? updateQuery.eq('slug', bodySlug as string)
      : updateQuery.eq('id', id as string);

    const { error } = await updateQuery;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
