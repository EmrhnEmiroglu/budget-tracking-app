import { useState, useEffect } from 'react'
import { X, Send, Bell, BarChart3, Copy, Check, Unlink, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'

export default function TelegramModal({ isOpen, onClose }) {
  const { authFetch } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [linkCode, setLinkCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    if (isOpen) fetchStatus()
  }, [isOpen])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await authFetch(`${API_URL}/telegram/status`)
      const data = await res.json()
      if (data.success) setStatus(data.data)
    } catch (e) {
      console.error('Telegram durum hatası:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    try {
      const res = await authFetch(`${API_URL}/telegram/generate-code`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setLinkCode(data.data)
    } catch (e) {
      console.error('Kod oluşturma hatası:', e)
    }
  }

  const copyCode = () => {
    if (linkCode?.code) {
      navigator.clipboard.writeText(`/baglan ${linkCode.code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const updatePreference = async (key, value) => {
    try {
      setSaving(true)
      const newPrefs = { ...status.preferences, [key]: value }
      const res = await authFetch(`${API_URL}/telegram/preferences`, {
        method: 'PUT',
        body: JSON.stringify(newPrefs),
      })
      const data = await res.json()
      if (data.success) setStatus(prev => ({ ...prev, preferences: newPrefs }))
    } catch (e) {
      console.error('Tercih güncelleme hatası:', e)
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    if (!confirm('Telegram bağlantısını kesmek istediğinize emin misiniz?')) return
    try {
      setDisconnecting(true)
      const res = await authFetch(`${API_URL}/telegram/disconnect`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setStatus(prev => ({ ...prev, connected: false }))
        setLinkCode(null)
      }
    } catch (e) {
      console.error('Bağlantı kesme hatası:', e)
    } finally {
      setDisconnecting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl rise"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #229ED9, #1a7ab5)' }}
            >
              <Send size={18} className="text-white" />
            </div>
            <div>
              <div className="display font-semibold" style={{ color: 'var(--text)' }}>Telegram Bildirimleri</div>
              <div className="text-xs" style={{ color: status?.connected ? 'var(--success)' : 'var(--text-3)' }}>
                {status?.connected ? '● Bağlı' : '○ Bağlı değil'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition"
            style={{ color: 'var(--text-3)', background: 'var(--surface-2)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw size={22} className="animate-spin" style={{ color: 'var(--text-3)' }} />
            </div>
          ) : status?.connected ? (
            <>
              {/* Connected banner */}
              <div
                className="p-4 rounded-xl text-sm"
                style={{
                  background: 'color-mix(in oklab, var(--success) 10%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--success) 25%, transparent)',
                  color: 'var(--success)',
                }}
              >
                Telegram hesabın bağlı. Bildirim tercihlerini aşağıdan ayarlayabilirsin.
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
                  Bildirim Tercihleri
                </div>

                {[
                  { key: 'subscriptions', icon: Bell,      label: 'Abonelik Hatırlatma', sub: 'Ödeme günlerinde bildirim',   hue: 'var(--warning)' },
                  { key: 'weeklySummary', icon: BarChart3, label: 'Aylık Özet',          sub: 'Her ayın 1\'inde bakiye özeti', hue: '#38BDF8' },
                ].map(({ key, icon: Icon, label, sub, hue }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: `color-mix(in oklab, ${hue} 12%, transparent)`, color: hue }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</div>
                        <div className="text-xs" style={{ color: 'var(--text-3)' }}>{sub}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => updatePreference(key, !status.preferences[key])}
                      disabled={saving}
                      className="w-11 h-6 rounded-full transition-all relative shrink-0"
                      style={{
                        background: status.preferences[key]
                          ? 'var(--success)'
                          : 'var(--border)',
                      }}
                    >
                      <span
                        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                        style={{ left: status.preferences[key] ? 22 : 2 }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Disconnect */}
              <button
                onClick={disconnect}
                disabled={disconnecting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition"
                style={{
                  background: 'color-mix(in oklab, var(--danger) 10%, transparent)',
                  border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)',
                  color: 'var(--danger)',
                }}
              >
                <Unlink size={15} />
                {disconnecting ? 'Kesiliyor...' : 'Bağlantıyı Kes'}
              </button>
            </>
          ) : (
            <>
              {/* Info banner */}
              <div
                className="p-4 rounded-xl text-sm"
                style={{
                  background: 'color-mix(in oklab, #229ED9 10%, transparent)',
                  border: '1px solid color-mix(in oklab, #229ED9 20%, transparent)',
                  color: '#38BDF8',
                }}
              >
                Telegram'dan bildirim almak için hesabını bağla.
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <StepNum n={1} />
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Bağlantı kodu al</div>
                    {!linkCode ? (
                      <button
                        onClick={generateCode}
                        className="px-4 py-2 rounded-xl text-sm font-semibold btn-primary"
                      >
                        Kod Oluştur
                      </button>
                    ) : (
                      <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                      >
                        <code className="flex-1 mono text-lg font-bold" style={{ color: 'var(--success)' }}>
                          {linkCode.code}
                        </code>
                        <button
                          onClick={copyCode}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                          style={{
                            background: copied ? 'var(--success)' : 'var(--border)',
                            color: copied ? '#fff' : 'var(--text-2)',
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <StepNum n={2} />
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Telegram botunu aç</div>
                    {linkCode?.botUsername ? (
                      <a
                        href={`https://t.me/${linkCode.botUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium"
                        style={{ color: '#38BDF8' }}
                      >
                        <Send size={13} />
                        @{linkCode.botUsername}
                      </a>
                    ) : (
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>Önce kod oluştur</div>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <StepNum n={3} />
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Bota kodu gönder</div>
                    {linkCode ? (
                      <code
                        className="mono text-sm px-3 py-1.5 rounded-lg inline-block"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                      >
                        /baglan {linkCode.code}
                      </code>
                    ) : (
                      <div className="text-xs" style={{ color: 'var(--text-3)' }}>Önce kod oluştur</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Check connection */}
              {linkCode && (
                <button
                  onClick={fetchStatus}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                >
                  <RefreshCw size={15} />
                  Bağlantıyı Kontrol Et
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepNum({ n }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mono"
      style={{
        background: 'color-mix(in oklab, var(--accent) 15%, transparent)',
        color: 'var(--accent)',
        border: '1px solid color-mix(in oklab, var(--accent) 30%, transparent)',
      }}
    >
      {n}
    </div>
  )
}
