import * as cheerio from 'cheerio';
import { Badge, Profile, Stats } from './types';
import { categorizeBadge, calculateStats } from './utils';

const ALLOWED_HOSTNAMES = new Set([
  'cloudskillsboost.google',
  'www.cloudskillsboost.google',
  'skills.google',
  'www.skills.google',
]);

const ALLOWED_PATH_PREFIXES = ['/public_profiles/', '/profiles/'];

export function isValidProfileUrl(raw: string): boolean {
  let urlObj: URL;
  try { urlObj = new URL(raw); } catch { return false; }
  if (urlObj.protocol !== 'https:') return false;
  if (!ALLOWED_HOSTNAMES.has(urlObj.hostname)) return false;
  if (!ALLOWED_PATH_PREFIXES.some(p => urlObj.pathname.startsWith(p))) return false;
  if (urlObj.username || urlObj.password) return false;
  return true;
}

export function parseProfileHtmlServer(html: string): Profile {
  const $ = cheerio.load(html);

  const titleText = $('title').text().toLowerCase();
  const bodyText = $('body').text() || '';
  if (titleText.includes('page not found') || bodyText.includes("The page you were looking for doesn't exist")) {
    throw new Error('Profil tidak ditemukan (404).');
  }

  const textContent = bodyText.toLowerCase();
  if (
    textContent.includes('profile is private') ||
    textContent.includes('profil ini disetel privat') ||
    textContent.includes('make profile public')
  ) {
    throw new Error('Profil disetel ke PRIVATE. Silakan ubah ke PUBLIC di pengaturan Google Cloud Skills Boost.');
  }

  const nameEl = $('h1.ql-headline-1').first().length > 0
    ? $('h1.ql-headline-1').first()
    : ($('h1').first().length > 0 ? $('h1').first() : $('.profile-name').first());
  const profileName = nameEl.length > 0 ? (nameEl.text().trim() || 'Explorer') : 'Explorer';

  let avatarUrl = '';
  const avatarSelectors = [
    'ql-avatar img', '.avatar img', 'img[alt*="avatar" i]',
    'img[src*="googleusercontent"]', 'img[src*="lh3.google"]', 'img[src*="photo"]',
    '.profile-photo img', "[class*='avatar'] img", "[class*='photo'] img",
  ];
  for (const sel of avatarSelectors) {
    const img = $(sel).first();
    if (img.length > 0) {
      const src = img.attr('src') || '';
      if (src.startsWith('http')) { avatarUrl = src; break; }
      if (src.startsWith('//')) { avatarUrl = 'https:' + src; break; }
      if (src.startsWith('/')) { avatarUrl = 'https://www.cloudskillsboost.google' + src; break; }
    }
  }
  if (!avatarUrl) {
    const m = html.match(/https:\/\/lh3\.googleusercontent\.com\/[^"'\s]+/) ||
              html.match(/https:\/\/[a-z0-9]+\.googleusercontent\.com\/[^"'\s]+/);
    if (m) avatarUrl = m[0];
  }

  let badgeElements = $('.profile-badge, ql-badge, .badge-card, div[class*="badge"]');
  if (badgeElements.length === 0) {
    badgeElements = $('div > lwc-profile-badge, lwc-profile-badge, .profile-badges div');
  }

  const badges: Badge[] = [];
  badgeElements.each((_, el) => {
    const badgeEl = $(el);
    const titleEl = badgeEl.find('.ql-title-medium').first().length > 0
      ? badgeEl.find('.ql-title-medium').first()
      : (badgeEl.find('span[class*="title"]').first().length > 0
        ? badgeEl.find('span[class*="title"]').first()
        : (badgeEl.find('.badge-title').first().length > 0
          ? badgeEl.find('.badge-title').first()
          : (badgeEl.find('h2').first().length > 0
            ? badgeEl.find('h2').first()
            : badgeEl.find('span').first())));

    const dateEl = badgeEl.find('.ql-body-medium').first().length > 0
      ? badgeEl.find('.ql-body-medium').first()
      : (badgeEl.find('span[class*="date"]').first().length > 0
        ? badgeEl.find('span[class*="date"]').first()
        : (badgeEl.find('.badge-date').first().length > 0
          ? badgeEl.find('.badge-date').first()
          : badgeEl.find('p').first()));

    const imgEl = badgeEl.find('img').first();
    const linkEl = badgeEl.closest("a[href*='badges']").length > 0
      ? badgeEl.closest("a[href*='badges']")
      : badgeEl.find("a[href*='badges']");

    const title = titleEl.text().trim();
    const dateEarned = dateEl.text().trim();
    const imageUrl = imgEl.attr('src') || '';
    const badgeUrl = linkEl.length > 0 ? linkEl.attr('href') : undefined;

    if (title || imageUrl) {
      const category = title.toLowerCase().includes('ai boost bites')
        ? 'Course'
        : categorizeBadge(title || 'Uncategorized');
      badges.push({
        title: title || 'Unknown Badge',
        dateEarned: dateEarned || 'Unknown Date',
        imageUrl,
        category,
        badgeUrl,
      });
    }
  });

  const filteredBadges = badges.filter(b => b.title !== 'Unknown Badge' || b.imageUrl !== '');

  if (filteredBadges.length === 0 && !textContent.includes('badge')) {
    throw new Error('Tidak ada badge yang terdeteksi.');
  }

  const seenKeys = new Set<string>();
  const dedupedBadges = filteredBadges.filter(b => {
    const key = `${b.title}||${b.dateEarned}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return { name: profileName, avatarUrl, badges: dedupedBadges };
}

export interface VerifiedResult {
  profile: Profile;
  stats: Stats;
}

export async function fetchAndVerifyProfile(profileUrl: string, hasExtraBonus: boolean = false): Promise<VerifiedResult> {
  if (!isValidProfileUrl(profileUrl)) {
    throw new Error('URL tidak valid. Gunakan link public profile Google Cloud Skills Boost.');
  }

  const response = await fetch(profileUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ArcadePoints/1.0)',
      'Accept': 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15_000),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil profil (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    throw new Error('Response bukan HTML.');
  }

  const html = await response.text();
  if (html.length > 5_000_000) {
    throw new Error('Response terlalu besar.');
  }

  const profile = parseProfileHtmlServer(html);
  profile.name = profile.name.replace(/<[^>]*>/g, '').trim().slice(0, 100);

  const stats = calculateStats(profile, hasExtraBonus);

  return { profile, stats };
}
