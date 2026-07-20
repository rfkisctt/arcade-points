import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: { slug: string } }) {
  const { slug } = params

  let name = 'Arcade Points'
  let totalPoints = 0
  let milestoneName = '-'
  let gameCount = 0
  let skillCount = 0

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/leaderboard/by-slug/${slug}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      name = data.name || name
      totalPoints = data.totalPoints || 0
      milestoneName = data.milestoneName || '-'
      gameCount = data.gameCount || 0
      skillCount = data.skillCount || 0
    }
  } catch {
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#141414',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px)',
        }} />

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(252,170,38,0.08) 0%, transparent 70%)',
          display: 'flex',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 1 }}>
          {/* App label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', letterSpacing: 4, textTransform: 'uppercase' }}>
              ARCADE POINTS
            </span>
          </div>

          <div style={{
            fontSize: 52, fontWeight: 800, color: 'white', textAlign: 'center',
            maxWidth: 900, lineHeight: 1.1, letterSpacing: -1,
          }}>
            {name}
          </div>

          <div style={{ fontSize: 100, fontWeight: 900, color: '#FCAA26', lineHeight: 1, letterSpacing: -3 }}>
            {totalPoints}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -4 }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', letterSpacing: 2 }}>TOTAL POINTS</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(252,170,38,0.1)', border: '1px solid rgba(252,170,38,0.25)',
            borderRadius: 100, padding: '10px 24px', marginTop: 4,
          }}>
            <span style={{ fontSize: 20, color: '#FCAA26', fontWeight: 700 }}>★ {milestoneName}</span>
          </div>

          <div style={{ display: 'flex', gap: 48, marginTop: 12 }}>
            {[
              { label: 'GAME', value: gameCount },
              { label: 'SKILL BADGE', value: skillCount },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 3 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
            arcade-points.vercel.app
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
