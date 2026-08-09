// Shared UI atoms — design system components
import { useEffect, useRef, useState } from 'react'

// ── Formatters ──────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n)

export const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// ── Animated count-up ───────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const e = 1 - Math.pow(1 - p, 3)
      setV(target * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

// ── Money display ───────────────────────────────────────────────
export function Money({ value, size = 28, weight = 700, className = '', glow = false }) {
  const v = useCountUp(value)
  return (
    <div
      className={`mono tabular ${className}`}
      style={{ fontSize: size, fontWeight: weight, lineHeight: 1, letterSpacing: '-0.01em' }}
    >
      <span className={glow ? 'num-glow' : ''}>{fmt(v)}</span>
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────
export function Badge({ children, tone = 'neutral', icon: Icon }) {
  const tones = {
    accent:  { fg: 'var(--accent)',  bg: 'color-mix(in oklab, var(--accent) 15%, transparent)' },
    success: { fg: 'var(--success)', bg: 'color-mix(in oklab, var(--success) 15%, transparent)' },
    danger:  { fg: 'var(--danger)',  bg: 'color-mix(in oklab, var(--danger) 15%, transparent)' },
    warning: { fg: 'var(--warning)', bg: 'color-mix(in oklab, var(--warning) 18%, transparent)' },
    neutral: { fg: 'var(--text-2)',  bg: 'color-mix(in oklab, var(--text) 8%, transparent)' },
  }[tone] || { fg: 'var(--text-2)', bg: 'color-mix(in oklab, var(--text) 8%, transparent)' }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ color: tones.fg, background: tones.bg, border: '1px solid ' + tones.fg + '33' }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}

// ── Button ───────────────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', icon: Icon, className = '', type = 'button', title, disabled }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-5 py-3 text-sm rounded-2xl',
  }[size]

  const variantMap = {
    primary: { className: 'btn-primary font-semibold', style: {} },
    ghost: {
      className: 'font-medium',
      style: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }
    },
    quiet: {
      className: '',
      style: { background: 'transparent', color: 'var(--text-2)' }
    },
    danger: {
      className: 'font-semibold',
      style: {
        background: 'color-mix(in oklab, var(--danger) 15%, transparent)',
        color: 'var(--danger)',
        border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)'
      }
    },
  }[variant] || { className: 'btn-primary font-semibold', style: {} }

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center gap-2 transition active:scale-[0.98] ${sizes} ${variantMap.className} ${className}`}
      style={variantMap.style}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

// ── Card ─────────────────────────────────────────────────────────
export function Card({ children, className = '', pad = 'p-6', style }) {
  return (
    <div className={`card ${pad} ${className}`} style={style}>
      {children}
    </div>
  )
}

// ── Section title ────────────────────────────────────────────────
export function SectionTitle({ eyebrow, title, sub, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
            {eyebrow}
          </div>
        )}
        <h2 className="display text-[22px] font-semibold mt-1" style={{ color: 'var(--text)' }}>{title}</h2>
        {sub && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{sub}</p>}
      </div>
      {right}
    </div>
  )
}

// ── Ring progress ────────────────────────────────────────────────
export function RingProgress({ pct, size = 72, stroke = 7, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(1, pct / 100))
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        fill="none" strokeDasharray={c} strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)' }}
      />
    </svg>
  )
}

// ── Sparkline ────────────────────────────────────────────────────
export function Sparkline({ data, w = 220, h = 56, color = 'var(--accent)' }) {
  if (!data.length) return null
  const max = Math.max(...data), min = Math.min(...data)
  const stepX = w / (data.length - 1)
  const y = (v) => h - ((v - min) / (max - min || 1)) * (h - 8) - 4
  const points = data.map((v, i) => [i * stepX, y(v)])
  const d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const fill = d + ` L ${w} ${h} L 0 ${h} Z`
  const gid = 'spark-' + Math.random().toString(36).slice(2, 8)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ── PillToggle ───────────────────────────────────────────────────
export function PillToggle({ options, value, onChange }) {
  return (
    <div className="toggle-pill">
      {options.map((o) => {
        const active = o.value === value
        const bg = o.activeBg || 'var(--accent)'
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="px-5 py-2 text-sm font-semibold rounded-full transition"
            style={{
              background: active ? bg : 'transparent',
              color: active ? 'white' : 'var(--text-2)',
              boxShadow: active ? '0 6px 20px -8px ' + bg : 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Monogram avatar ──────────────────────────────────────────────
export function Monogram({ letter, hue, size = 44, round = 14 }) {
  const bg = `oklch(0.28 0.12 ${hue})`
  const fg = `oklch(0.92 0.14 ${hue})`
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size, height: size, borderRadius: round,
        background: bg,
        border: `1px solid oklch(0.38 0.15 ${hue} / 0.7)`,
        color: fg, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size * 0.42
      }}
    >
      {letter}
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────
export function EmptyState({ title, body, cta, onCta, icon: Icon }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div
        className="mb-4 flex items-center justify-center w-16 h-16 rounded-3xl"
        style={{ background: 'color-mix(in oklab, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
      >
        {Icon && <Icon size={28} />}
      </div>
      <div className="display text-lg font-semibold">{title}</div>
      <div className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-2)' }}>{body}</div>
      {cta && (
        <div className="mt-4">
          <Button onClick={onCta}>{cta}</Button>
        </div>
      )}
    </div>
  )
}

// ── KPI card ─────────────────────────────────────────────────────
export function KpiCard({ icon: Icon, tone, label, value, delta, sub, className = '' }) {
  const toneMap = {
    success: { fg: 'var(--success)', bg: 'color-mix(in oklab, var(--success) 14%, transparent)' },
    danger:  { fg: 'var(--danger)',  bg: 'color-mix(in oklab, var(--danger) 14%, transparent)' },
    warning: { fg: 'var(--warning)', bg: 'color-mix(in oklab, var(--warning) 14%, transparent)' },
    accent:  { fg: 'var(--accent)',  bg: 'color-mix(in oklab, var(--accent) 14%, transparent)' },
  }[tone] || { fg: 'var(--accent)', bg: 'color-mix(in oklab, var(--accent) 14%, transparent)' }

  const isDown = delta && delta.includes('-')

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: toneMap.bg, color: toneMap.fg }}>
          {Icon && <Icon size={18} />}
        </div>
        {delta && (
          <span className="mono text-[11px] font-semibold" style={{ color: isDown ? 'var(--success)' : toneMap.fg }}>
            {delta}
          </span>
        )}
      </div>
      <div className="mono text-[11px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>{label}</div>
      <Money value={value} size={28} className="mt-1" />
      {sub && <div className="text-[11px] mt-1.5" style={{ color: 'var(--text-3)' }}>{sub}</div>}
    </Card>
  )
}
