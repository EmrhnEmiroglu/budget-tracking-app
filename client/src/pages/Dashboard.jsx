import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, Area, AreaChart
} from 'recharts'
import { TrendingUp, TrendingDown, CreditCard, ArrowRight } from 'lucide-react'
import { Card, SectionTitle, Money, Badge, KpiCard, Monogram, Sparkline, fmt, fmtDate } from '../components/ui'
import { API_URL } from '../config'

const ACCENT = '#6C63FF'
const PIE_COLORS = [ACCENT, '#8B7BFF', '#22C55E', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899', '#94A3B8']

function daysUntilBillingDay(day) {
  const today = new Date()
  const cur = today.getDate()
  if (day >= cur) return day - cur
  const next = new Date(today.getFullYear(), today.getMonth() + 1, day)
  return Math.round((next - today) / 86400000)
}

export default function Dashboard() {
  const { authFetch } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 })
  const [pieData, setPieData] = useState([])
  const [pendingSubs, setPendingSubs] = useState([])
  const [recentExpenses, setRecentExpenses] = useState([])
  const [subsMonthly, setSubsMonthly] = useState(0)
  const [trendData, setTrendData] = useState([])

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [summaryRes, analysisRes, pendingRes, expensesRes, subsRes, trendRes] = await Promise.all([
        authFetch(`${API_URL}/summary`),
        authFetch(`${API_URL}/expense-analysis`),
        authFetch(`${API_URL}/subscriptions/pending`),
        authFetch(`${API_URL}/expenses`),
        authFetch(`${API_URL}/subscriptions`),
        authFetch(`${API_URL}/expense-trend`),
      ])

      const [summaryData, analysisData, pendingData, expensesData, subsData, trendDataRes] = await Promise.all([
        summaryRes.json(), analysisRes.json(), pendingRes.json(), expensesRes.json(), subsRes.json(), trendRes.json()
      ])

      if (summaryData.success) setSummary(summaryData.data)
      if (analysisData.success) setPieData(analysisData.data.filter(d => d.value > 0))
      if (trendDataRes.success) setTrendData(trendDataRes.data)
      if (pendingData.success) {
        const sorted = [...pendingData.data].sort((a, b) => daysUntilBillingDay(a.billing_day) - daysUntilBillingDay(b.billing_day))
        setPendingSubs(sorted.slice(0, 4))
      }
      if (expensesData.success) {
        const sorted = [...expensesData.data].sort((a, b) => b.date?.localeCompare(a.date)).slice(0, 5)
        setRecentExpenses(sorted)
      }
      if (subsData.success) {
        const total = subsData.data.reduce((a, s) => a + (s.amount || 0), 0)
        setSubsMonthly(total)
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
  }

  // Harcama trendi artık /api/expense-trend üzerinden gerçek veriyle gelir (fetchAll içinde)
  const sparkValues = trendData.map(d => d.amount)

  return (
    <div className="px-8 py-6 space-y-6 rise-stagger" style={{ maxWidth: 1480, margin: '0 auto' }}>

      {/* ── Top KPI Bento ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Balance hero */}
        <Card
          className="col-span-12 lg:col-span-6 relative overflow-hidden"
          pad="p-7"
          style={{
            background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, var(--surface)), var(--surface))'
          }}
        >
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full dotgrid opacity-30" />
          <div className="flex items-center justify-between mb-6 relative">
            <div className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
              net bakiye
            </div>
            <Badge tone={summary.balance >= 0 ? 'success' : 'danger'}>
              {summary.balance >= 0 ? 'Pozitif' : 'Negatif'}
            </Badge>
          </div>
          <div className="relative">
            <Money value={Math.abs(summary.balance)} size={60} weight={700} glow />
            <div className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
              Bu ay · gelir — gider
            </div>
          </div>
          {sparkValues.length > 0 && (
            <div className="mt-6">
              <Sparkline data={sparkValues} w={560} h={60} color={ACCENT} />
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 relative">
            <MiniStat label="Toplam Gelir" value={summary.total_income} color="var(--success)" />
            <MiniStat label="Toplam Gider" value={summary.total_expense} color="var(--danger)" />
          </div>
        </Card>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-6 grid grid-cols-2 gap-5">
          <KpiCard
            icon={TrendingUp}
            tone="success"
            label="Bu Ay Gelir"
            value={summary.total_income}
            className="col-span-1"
          />
          <KpiCard
            icon={TrendingDown}
            tone="danger"
            label="Bu Ay Gider"
            value={summary.total_expense}
            className="col-span-1"
          />

          {/* Subscriptions total */}
          <Card className="col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'color-mix(in oklab, var(--warning) 15%, transparent)', color: 'var(--warning)' }}
                  >
                    <CreditCard size={16} />
                  </div>
                  <div className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
                    aylık abonelik
                  </div>
                </div>
                <Money value={subsMonthly} size={32} />
                <div className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
                  {fmt(subsMonthly * 12)}/yıl
                </div>
              </div>
              <button
                onClick={() => navigate('/subscriptions')}
                className="text-[11px] font-semibold flex items-center gap-1 mt-1"
                style={{ color: 'var(--accent)' }}
              >
                Yönet <ArrowRight size={12} />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Pie chart */}
        <Card className="col-span-12 lg:col-span-8">
          <SectionTitle
            eyebrow="bu ay"
            title="Kategori Dağılımı"
            right={<Badge tone="neutral">Giderler</Badge>}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 items-center">
            <div style={{ height: 220 }}>
              {pieData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      cornerRadius={6}
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        color: 'var(--text)'
                      }}
                      formatter={(v, name) => [fmt(v), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>
                  Veri yok
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {pieData.slice(0, 6).map((c, i) => {
                const total = pieData.reduce((a, d) => a + d.value, 0)
                const pct = total > 0 ? Math.round(c.value / total * 100) : 0
                return (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 truncate" style={{ color: 'var(--text-2)' }}>{c.name}</span>
                    <span className="mono font-medium">%{pct}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Trend chart */}
        <Card className="col-span-12 lg:col-span-4">
          <SectionTitle eyebrow="son 30 gün" title="Harcama Trendi" />
          <div style={{ height: 220 }} className="mt-3 -mx-3">
            {trendData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis hide />
                  <CartesianGrid vertical={false} stroke="var(--border-soft)" />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }}
                    formatter={(v) => [fmt(v), 'Harcama']}
                  />
                  <Area type="monotone" dataKey="amount" stroke={ACCENT} strokeWidth={2.2} fill="url(#gradArea)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-3)' }}>
                Veri yok
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span style={{ color: 'var(--text-3)' }}>Günlük ort.</span>
            <span className="mono font-semibold">{fmt(Math.round(summary.total_expense / 30))}</span>
          </div>
        </Card>
      </div>

      {/* ── Bottom bento ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Upcoming subscriptions */}
        <Card className="col-span-12 lg:col-span-5">
          <SectionTitle
            eyebrow="yaklaşan"
            title="Abonelik Ödemeleri"
            right={
              <button
                onClick={() => navigate('/subscriptions')}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                Tümünü Gör <ArrowRight size={12} />
              </button>
            }
          />
          <div className="mt-4 space-y-2.5">
            {pendingSubs.length === 0 ? (
              <div className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>Yaklaşan ödeme yok</div>
            ) : pendingSubs.map((s) => {
              const days = daysUntilBillingDay(s.billing_day)
              const tone = days <= 2 ? 'danger' : days <= 5 ? 'warning' : 'neutral'
              const initial = s.name?.charAt(0).toUpperCase() || '?'
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <Monogram letter={initial} hue={220} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{s.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>her ayın {s.billing_day}. günü</div>
                  </div>
                  <Badge tone={tone}>{days === 0 ? 'Bugün' : days + ' gün'}</Badge>
                  <div className="mono text-sm font-semibold w-24 text-right" style={{ color: 'var(--text)' }}>
                    {fmt(s.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent transactions */}
        <Card className="col-span-12 lg:col-span-7">
          <SectionTitle
            eyebrow="son hareketler"
            title="Son İşlemler"
            right={
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                Tüm İşlemler <ArrowRight size={12} />
              </button>
            }
          />
          <div className="mt-4 divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentExpenses.length === 0 ? (
              <div className="text-sm text-center py-6" style={{ color: 'var(--text-3)' }}>Henüz işlem yok</div>
            ) : recentExpenses.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: t.type === 'income'
                      ? 'color-mix(in oklab, var(--success) 15%, transparent)'
                      : 'color-mix(in oklab, var(--accent) 15%, transparent)',
                    color: t.type === 'income' ? 'var(--success)' : 'var(--accent)',
                    border: '1px solid ' + (t.type === 'income'
                      ? 'color-mix(in oklab, var(--success) 30%, transparent)'
                      : 'color-mix(in oklab, var(--accent) 30%, transparent)')
                  }}
                >
                  {t.category_name?.charAt(0).toUpperCase() || (t.type === 'income' ? '↑' : '↓')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{t.description}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {t.category_name} · {t.date ? fmtDate(t.date) : ''}
                  </div>
                </div>
                <div
                  className="mono text-sm font-semibold tabular"
                  style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--text)' }}
                >
                  {t.type === 'income' ? '+' : '−'} {fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div
      className="p-3 rounded-xl"
      style={{ background: 'color-mix(in oklab, var(--surface-2) 60%, transparent)', border: '1px solid var(--border)' }}
    >
      <div className="mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="mono font-semibold text-[15px] tabular mt-1" style={{ color: color || 'var(--text)' }}>
        {fmt(value)}
      </div>
    </div>
  )
}
