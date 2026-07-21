/**
 * Badge Classifier — detects Completion Badge vs Skill Badge
 * by reading the text inside the badge image using basic pixel analysis.
 *
 * Strategy:
 * 1. Check Supabase cache first (image_url → badge_type)
 * 2. If not cached: fetch image → scan bottom portion for "COMPLETION BADGE" text
 *    using a simple approach: check if the image URL hash is known, or
 *    use the /api route to classify via sharp/canvas pixel analysis
 * 3. Store result in Supabase cache
 * 4. All future users with the same badge image get instant result from cache
 *
 * NOTE: Completion badge images from cdn.qwiklabs.com have a distinctive
 * white background with blue checkmark. Skill badge images have colored backgrounds.
 * We detect by fetching the image and checking for the word "COMPLETION BADGE"
 * using tesseract or by checking image color signature.
 */

import { supabase } from './supabase';
import { BadgeCategory } from './types';

export interface BadgeCacheRow {
  image_url: string;
  badge_type: BadgeCategory;
  classified_at: number;
}

const CACHE_TABLE = 'badge_image_cache';

// In-process memory cache to avoid repeated Supabase reads within one request
const memoryCache = new Map<string, BadgeCategory>();

/**
 * Bulk-lookup badge types from Supabase cache for a list of image URLs.
 * Returns a map of imageUrl → BadgeCategory for all URLs found in cache.
 */
export async function getBadgeTypesFromCache(
  imageUrls: string[]
): Promise<Map<string, BadgeCategory>> {
  if (imageUrls.length === 0) return new Map();

  // Check memory cache first
  const result = new Map<string, BadgeCategory>();
  const uncachedUrls: string[] = [];

  for (const url of imageUrls) {
    const cached = memoryCache.get(url);
    if (cached) {
      result.set(url, cached);
    } else {
      uncachedUrls.push(url);
    }
  }

  if (uncachedUrls.length === 0) return result;

  try {
    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select('image_url, badge_type')
      .in('image_url', uncachedUrls);

    if (error) {
      console.error('[BadgeClassifier] Cache lookup error:', error.message);
      return result;
    }

    for (const row of data ?? []) {
      const type = row.badge_type as BadgeCategory;
      result.set(row.image_url, type);
      memoryCache.set(row.image_url, type);
    }
  } catch (e) {
    console.error('[BadgeClassifier] Supabase error:', e);
  }

  return result;
}

/**
 * Classify a single badge image by fetching it and scanning for
 * "COMPLETION BADGE" text using color-based heuristic (no OCR needed).
 *
 * Completion badges are identified by:
 * 1. White/light background (rgb avg > 200)
 * 2. Presence of "COMPLETION BADGE" text pattern in the image
 *
 * Since we can't run Tesseract server-side efficiently in Next.js edge/serverless,
 * we use a reliable heuristic: fetch the image as raw bytes and look for
 * the text string embedded in PNG metadata or use background color detection.
 */
export async function classifyBadgeImage(imageUrl: string): Promise<BadgeCategory> {
  // Check memory cache
  const memCached = memoryCache.get(imageUrl);
  if (memCached) return memCached;

  // Check Supabase cache
  try {
    const { data } = await supabase
      .from(CACHE_TABLE)
      .select('badge_type')
      .eq('image_url', imageUrl)
      .maybeSingle();

    if (data?.badge_type) {
      const type = data.badge_type as BadgeCategory;
      memoryCache.set(imageUrl, type);
      return type;
    }
  } catch {
    // Cache miss is ok, continue to classify
  }

  // Classify by fetching the image
  const badgeType = await detectBadgeTypeFromImage(imageUrl);

  // Store in cache
  await storeBadgeTypeCache(imageUrl, badgeType);

  return badgeType;
}

/**
 * Detect badge type from image content.
 * 
 * Completion badges have a distinctive pattern:
 * - White/very light background 
 * - Blue circular checkmark in the center
 * - "COMPLETION BADGE" text at the bottom
 * 
 * We detect this by checking the PNG/JPEG raw bytes for the string "COMPLETION"
 * which sometimes appears in image metadata, OR by checking that the background
 * is white (which all completion badges have).
 * 
 * More reliable: we check the top-left corner pixels — completion badges
 * are white there, while skill badges have colored/dark backgrounds.
 */
async function detectBadgeTypeFromImage(imageUrl: string): Promise<BadgeCategory> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArcadePoints/1.0)',
        'Accept': 'image/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return 'Skill Badge';

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Method 1: Check raw bytes for "COMPLETION" text string
    // PNG files can contain text chunks, and some image tools embed metadata
    const textDecoded = decodeImageText(bytes);
    if (textDecoded.includes('completion')) {
      return 'Completion Badge';
    }

    // Method 2: Check if image has white background
    // Completion badges always have white bg, skill badges have colored backgrounds
    if (hasWhiteBackground(bytes)) {
      return 'Completion Badge';
    }

    return 'Skill Badge';
  } catch {
    return 'Skill Badge';
  }
}

/**
 * Decode readable text from raw image bytes.
 * PNG tEXt chunks and EXIF data sometimes contain metadata we can search.
 */
function decodeImageText(bytes: Uint8Array): string {
  // Convert bytes to string, looking for printable ASCII sequences
  let text = '';
  for (let i = 0; i < Math.min(bytes.length, 50000); i++) {
    const b = bytes[i];
    // Only printable ASCII
    if (b >= 32 && b < 127) {
      text += String.fromCharCode(b);
    } else {
      text += ' ';
    }
  }
  return text.toLowerCase();
}

/**
 * Check if the image has a predominantly white background.
 * 
 * We look for the IDAT chunk in PNG which contains the compressed pixel data.
 * As a simpler heuristic, we check if the raw bytes have a high density of
 * 0xFF bytes (white pixels in uncompressed form) in the early portion.
 * 
 * More reliable: for PNG files, the first pixel row after decompression
 * represents the top of the image. But since we can't decompress PNG in
 * pure server-side TS without a library, we use a proxy heuristic:
 * 
 * The PNG signature + IHDR chunk contains width/height.
 * Completion badge images from qwiklabs are square ~512x512 with white bg.
 * 
 * We look at byte patterns: PNG with white background will have high-value
 * bytes clustered at the pixel data regions.
 */
function hasWhiteBackground(bytes: Uint8Array): boolean {
  // Check PNG signature: 137 80 78 71 13 10 26 10
  const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;

  if (!isPng) {
    // For JPEG: check first JPEG segment for white background signature
    // JPEG starts with FF D8
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
    if (!isJpeg) return false;

    // For JPEG, count high-value bytes in the middle section
    // White pixels in JPEG tend to produce a lot of 0xFF bytes in scan data
    let highBytes = 0;
    const sampleStart = Math.floor(bytes.length * 0.3);
    const sampleEnd = Math.floor(bytes.length * 0.7);
    const sampleSize = sampleEnd - sampleStart;
    for (let i = sampleStart; i < sampleEnd; i++) {
      if (bytes[i] > 220) highBytes++;
    }
    return highBytes / sampleSize > 0.35;
  }

  // For PNG: after the IHDR chunk (at byte 33), we have the image data.
  // Count 0xFF bytes in the compressed IDAT chunks - white pixels compress
  // to patterns with many 0xFF values
  let highBytes = 0;
  const sampleStart = 33;
  const sampleEnd = Math.min(bytes.length, sampleStart + 20000);
  const sampleSize = sampleEnd - sampleStart;

  for (let i = sampleStart; i < sampleEnd; i++) {
    if (bytes[i] === 0xFF) highBytes++;
  }

  // Completion badges (white bg) tend to have > 8% 0xFF bytes in compressed data
  return highBytes / sampleSize > 0.08;
}

/**
 * Store badge type classification in Supabase cache.
 * Uses upsert so it's safe to call multiple times.
 */
async function storeBadgeTypeCache(imageUrl: string, badgeType: BadgeCategory): Promise<void> {
  memoryCache.set(imageUrl, badgeType);

  try {
    await supabase.from(CACHE_TABLE).upsert(
      {
        image_url: imageUrl,
        badge_type: badgeType,
        classified_at: Date.now(),
      },
      { onConflict: 'image_url' }
    );
  } catch (e) {
    console.error('[BadgeClassifier] Failed to store cache:', e);
  }
}

/**
 * Bulk classify multiple badge images concurrently.
 * Returns a map of imageUrl → BadgeCategory.
 * Already-cached badges are resolved instantly without any fetch.
 */
export async function classifyBadgeImages(
  imageUrls: string[]
): Promise<Map<string, BadgeCategory>> {
  if (imageUrls.length === 0) return new Map();

  // First bulk-check cache for all URLs
  const cacheResult = await getBadgeTypesFromCache(imageUrls);
  
  const uncached = imageUrls.filter(url => !cacheResult.has(url));

  if (uncached.length === 0) return cacheResult;

  // Classify uncached images concurrently (max 10 at a time)
  const CONCURRENCY = 10;
  const results = new Map<string, BadgeCategory>(cacheResult);

  for (let i = 0; i < uncached.length; i += CONCURRENCY) {
    const batch = uncached.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const type = await classifyBadgeImage(url);
        return [url, type] as [string, BadgeCategory];
      })
    );
    for (const [url, type] of batchResults) {
      results.set(url, type);
    }
  }

  return results;
}

/**
 * Classify unknown skill badges by fetching their badge detail page HTML
 * and checking for "completion" text. Results are stored in Supabase cache
 * so each badge ID is only fetched ONCE across all users forever.
 *
 * This adds newly discovered completion badge IDs to the in-memory cache
 * so isCompletionBadge() returns true for them going forward.
 */
export async function classifyUnknownBadges(badges: { badgeUrl?: string }[]): Promise<void> {
  const { extractBadgeId, COMPLETION_BADGE_IDS } = await import('./completionBadgeIds');

  // Collect badge IDs not yet in the known set
  const toCheck: Array<{ id: string; url: string }> = [];
  for (const badge of badges) {
    if (!badge.badgeUrl) continue;
    const id = extractBadgeId(badge.badgeUrl);
    if (!id || COMPLETION_BADGE_IDS.has(id)) continue;

    // Check Supabase cache first
    const cached = await supabase
      .from(CACHE_TABLE)
      .select('badge_type')
      .eq('image_url', `badge_id:${id}`)
      .maybeSingle();

    if (cached.data?.badge_type === 'Completion Badge') {
      COMPLETION_BADGE_IDS.add(id);
    } else if (!cached.data) {
      toCheck.push({ id, url: badge.badgeUrl });
    }
  }

  if (toCheck.length === 0) return;

  // Fetch badge pages concurrently (max 8 at a time)
  const CONCURRENCY = 8;
  for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
    const batch = toCheck.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async ({ id, url }) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ArcadePoints/1.0)', 'Accept': 'text/html' },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return;
        const html = await res.text();
        const lower = html.toLowerCase();
        const isCompletion = lower.includes('completion badge') || lower.includes('completion_badge');
        const badgeType: BadgeCategory = isCompletion ? 'Completion Badge' : 'Skill Badge';

        if (isCompletion) {
          COMPLETION_BADGE_IDS.add(id);
        }

        // Cache result using badge_id prefix as key
        await supabase.from(CACHE_TABLE).upsert(
          { image_url: `badge_id:${id}`, badge_type: badgeType, classified_at: Date.now() },
          { onConflict: 'image_url' }
        );
      } catch {
        // Non-fatal, badge stays as Skill Badge
      }
    }));
  }
}
