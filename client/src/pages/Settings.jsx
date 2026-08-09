import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Send, Bell, Lock, LogOut, Plus, Save, Download } from 'lucide-react'
import { Card, Badge } from '../components/ui'
import TelegramModal from '../components/TelegramModal'

import { API_URL } from '../config'

const SECTIONS = [
  ['profile',  'Profil',      User],
  ['telegram', 'Telegram Bot', Send],
  ['categories','Kategoriler', Bell],
  ['security', 'Güvenlik',    Lock],
  ['danger',   'Hesap',       LogOut],
]

export default function Settings() {
  const { user, authFetch, logout } = useAuth()
  const [section, setSection] = useState('profile')
  const [categories, setCategories] = useState([])
  const [budgets, setBudgets] = useState({})
  const [newCat, setNewCat] = useState({ name: '', type: 'Gider' })
  const [saving, setSaving] = useState(null)
  const [addingCat, setAddingCat] = useState(false)

  // Şifre değiştirme formu
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState(null)   // { type: 'success' | 'error', text }

  // Telegram modalı
  const [telegramOpen, setTelegramOpen] = useState(false)

  useEffect(() => { fetchCategories() }, [])

  const changePassword = async () => {
    setPwMsg(null)
    if (pw.next.length < 6) { setPwMsg({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalı' }); return }
    if (pw.next !== pw.confirm) { setPwMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor' }); return }
    try {
      setPwLoading(true)
      const res = await authFetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next })
      })
      const data = await res.json()
      if (data.success) {
        setPwMsg({ type: 'success', text: 'Şifreniz güncellendi' })
        setPw({ current: '', next: '', confirm: '' })
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Bir hata oluştu' })
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Sunucuya bağlanılamadı' })
    } finally {
      setPwLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await authFetch(`${API_URL}/categories`)
      const data = await res.json()
      if (data.success) {
        setCategories(data.data)
        const map = {}
        data.data.forEach(c => { map[c.id] = c.budget_limit || 0 })
        setBudgets(map)
      }
    } catch { }
  }

  const addCategory = async () => {
    if (!newCat.name.trim()) return
    try {
      setAddingCat(true)
      const res = await authFetch(`${API_URL}/categories`, {
        method: 'POST',
        body: JSON.stringify(newCat)
      })
      const data = await res.json()
      if (data.success) {
        setNewCat({ name: '', type: 'Gider' })
        fetchCategories()
      }
    } catch { }
    finally { setAddingCat(false) }
  }

  const saveBudget = async (id) => {
    try {
      setSaving(id)
      await authFetch(`${API_URL}/categories/${id}/budget`, {
        method: 'PUT',
        body: JSON.stringify({ budget_limit: budgets[id] || 0 })
      })
    } catch { }
    finally { setSaving(null) }
  }

  const exportCSV = async () => {
    try {
      const res = await authFetch(`${API_URL}/expenses`)
      const data = await res.json()
      if (!data.success || data.data.length === 0) return
      const headers = ['Tarih', 'Kategori', 'Tür', 'Açıklama', 'Tutar']
      const rows = data.data.map(e => [e.date, e.category_name, e.category_type, e.description || '', e.amount.toString().replace('.', ',')])
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n')
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `islemler-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch { }
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'ME'

  return (
    <div className="px-8 py-6 rise-stagger" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="grid grid-cols-12 gap-6">

        {/* Left nav */}
        <aside className="col-span-12 md:col-span-3">
          <nav className="space-y-1 sticky top-24">
            {SECTIONS.map(([v, l, Icon]) => (
              <button
                key={v}
                onClick={() => setSection(v)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left"
                style={{
                  background: section === v ? 'color-mix(in oklab, var(--accent) 12%, transparent)' : 'transparent',
                  color: section === v ? 'var(--accent)' : 'var(--text-2)',
                  border: section === v ? '1px solid color-mix(in oklab, var(--accent) 30%, transparent)' : '1px solid transparent',
                }}
              >
                <Icon size={16} />
                <span className="font-medium">{l}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <div className="col-span-12 md:col-span-9 space-y-5">

          {/* Profile */}
          {section === 'profile' && (
            <SectionCard eyebrow="profil" title="Kişisel Bilgiler" sub="Hesabınız ve temel bilgileriniz">
              <div className="flex items-center gap-5 mb-6">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center display text-2xl font-semibold"
                  style={{ background: 'oklch(0.32 0.14 280)', color: 'oklch(0.94 0.12 280)' }}
                >
                  {initials}
                </div>
                <div>
                  <div className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>{user?.username}</div>
                  <div className="text-sm" style={{ color: 'var(--text-2)' }}>{user?.email}</div>
                  {user?.is_admin && <div className="mt-2"><Badge tone="accent">Admin</Badge></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldDisplay label="kullanıcı adı" value={user?.username} />
                <FieldDisplay label="email" value={user?.email} />
                <FieldDisplay label="para birimi" value="Türk Lirası (TRY)" />
                <FieldDisplay label="üyelik" value="Standart" />
              </div>
            </SectionCard>
          )}

          {/* Telegram */}
          {section === 'telegram' && (
            <SectionCard eyebrow="entegrasyon" title="Telegram Bot" sub="Ödeme günleri ve bildirimler için Telegram bağlantısı">
              <div
                className="card-2 p-4 mb-4"
                style={{ background: 'color-mix(in oklab, var(--accent) 8%, var(--surface-2))' }}
              >
                <div className="flex gap-3">
                  <Send size={16} style={{ color: 'var(--accent)' }} />
                  <div className="text-sm" style={{ color: 'var(--text-2)' }}>
                    Telegram hesabınızı bağlayın ve hangi bildirimleri almak istediğinizi seçin.
                    Bağlantı ve tercihler aşağıdaki pencereden yönetilir.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTelegramOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold btn-primary"
              >
                <Send size={16} /> Telegram Bağlantısını Yönet
              </button>
            </SectionCard>
          )}

          {/* Categories */}
          {section === 'categories' && (
            <SectionCard eyebrow="kategoriler" title="Kategoriler ve Bütçe" sub="Harcama kategorileri ve aylık bütçe limitleri">
              {/* Add new category */}
              <div
                className="card-2 p-4 mb-5 flex items-end gap-3 flex-wrap"
              >
                <div className="field flex-1 min-w-[160px] px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>kategori adı</div>
                  <input
                    value={newCat.name}
                    onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                    placeholder="Yeni kategori"
                    className="text-sm"
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                  />
                </div>
                <div className="field px-3 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>tür</div>
                  <select
                    value={newCat.type}
                    onChange={e => setNewCat(p => ({ ...p, type: e.target.value }))}
                    className="text-sm"
                  >
                    <option value="Gider">Gider</option>
                    <option value="Gelir">Gelir</option>
                  </select>
                </div>
                <button
                  onClick={addCategory}
                  disabled={addingCat}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold btn-primary"
                >
                  <Plus size={16} /> Ekle
                </button>
              </div>

              {/* Category list */}
              <div className="space-y-2">
                {categories.map(c => {
                  const isIncome = c.type === 'Gelir'
                  const hue = isIncome ? 150 : 265
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: `oklch(0.26 0.1 ${hue})`,
                          color: `oklch(0.88 0.14 ${hue})`
                        }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-3)' }}>{c.type}</div>
                      </div>
                      {c.type === 'Gider' && (
                        <div className="flex items-center gap-2">
                          <div className="field flex items-center gap-1 px-2 py-1">
                            <span className="mono text-[11px]" style={{ color: 'var(--text-3)' }}>₺</span>
                            <input
                              type="number"
                              value={budgets[c.id] || 0}
                              onChange={e => setBudgets(p => ({ ...p, [c.id]: parseFloat(e.target.value) || 0 }))}
                              className="mono text-sm w-20"
                              placeholder="0"
                            />
                          </div>
                          <button
                            onClick={() => saveBudget(c.id)}
                            disabled={saving === c.id}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                          >
                            {saving === c.id ? (
                              <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                                   style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                            ) : <Save size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* Security */}
          {section === 'security' && (
            <SectionCard eyebrow="güvenlik" title="Şifre ve Oturum">
              {pwMsg && (
                <div
                  className="mb-3 p-3 rounded-xl text-sm"
                  style={{
                    background: pwMsg.type === 'success'
                      ? 'color-mix(in oklab, var(--success) 12%, transparent)'
                      : 'color-mix(in oklab, var(--danger) 12%, transparent)',
                    border: `1px solid color-mix(in oklab, ${pwMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'} 25%, transparent)`,
                    color: pwMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'
                  }}
                >
                  {pwMsg.text}
                </div>
              )}
              <div className="field px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>mevcut şifre</div>
                <input
                  type="password"
                  value={pw.current}
                  onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                  placeholder="••••••••"
                  className="text-sm mono"
                />
              </div>
              <div className="mt-3 field px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>yeni şifre</div>
                <input
                  type="password"
                  value={pw.next}
                  onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                  placeholder="••••••••"
                  className="text-sm mono"
                />
              </div>
              <div className="mt-3 field px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>yeni şifre tekrar</div>
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="••••••••"
                  className="text-sm mono"
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                />
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={changePassword}
                  disabled={pwLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold btn-primary disabled:opacity-50"
                >
                  {pwLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Lock size={16} />}
                  Şifreyi Güncelle
                </button>
              </div>
            </SectionCard>
          )}

          {/* Danger / Account */}
          {section === 'danger' && (
            <SectionCard eyebrow="hesap" title="Oturum ve Veriler">
              <div className="space-y-3">
                <div className="card-2 p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Verilerinizi İndirin</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Tüm işlem, abonelik ve not verilerinizi CSV olarak alın.
                    </div>
                  </div>
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-medium"
                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    <Download size={16} /> İndir
                  </button>
                </div>

                <div
                  className="card-2 p-4 flex items-center justify-between"
                  style={{ borderColor: 'color-mix(in oklab, var(--danger) 25%, var(--border))' }}
                >
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--danger)' }}>Hesaptan Çık</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      Tüm cihazlardan oturumu kapatır.
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold"
                    style={{
                      background: 'color-mix(in oklab, var(--danger) 15%, transparent)',
                      color: 'var(--danger)',
                      border: '1px solid color-mix(in oklab, var(--danger) 30%, transparent)'
                    }}
                  >
                    <LogOut size={16} /> Çıkış Yap
                  </button>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <TelegramModal isOpen={telegramOpen} onClose={() => setTelegramOpen(false)} />
    </div>
  )
}

function SectionCard({ eyebrow, title, sub, children }) {
  return (
    <Card pad="p-6">
      <div className="mb-5">
        <div className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>{eyebrow}</div>
        <div className="display text-[20px] font-semibold mt-1" style={{ color: 'var(--text)' }}>{title}</div>
        {sub && <div className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{sub}</div>}
      </div>
      {children}
    </Card>
  )
}

function FieldDisplay({ label, value }) {
  return (
    <div className="field px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>{label}</div>
      <div className="text-sm" style={{ color: 'var(--text)' }}>{value || '—'}</div>
    </div>
  )
}
