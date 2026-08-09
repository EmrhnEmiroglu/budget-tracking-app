import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import TelegramModal from './TelegramModal'
import {
  LayoutDashboard, ArrowLeftRight, PlusCircle, CreditCard,
  Target, Settings, Shield, LogOut, Sun, Moon, Plus,
  Sparkles, Send
} from 'lucide-react'

const NAV = [
  { path: '/',                label: 'Özet',              icon: LayoutDashboard },
  { path: '/transactions',    label: 'Hareketler',        icon: ArrowLeftRight },
  { path: '/add',             label: 'İşlem Ekle',        icon: PlusCircle },
  { path: '/subscriptions',   label: 'Abonelikler',       icon: CreditCard },
  { path: '/notes',           label: 'Notlar & Hedefler', icon: Target },
  { path: '/settings',        label: 'Ayarlar',           icon: Settings },
]

const PAGE_TITLES = {
  '/':               ['Özet',              'Mali durumunuzun genel görünümü'],
  '/transactions':   ['Hareketler',        'Tüm gelir ve giderleriniz'],
  '/add':            ['Yeni İşlem',        'Gelir veya gider kaydı'],
  '/subscriptions':  ['Abonelikler',       'Otomatik ödemeler ve yenilemeler'],
  '/notes':          ['Notlar & Hedefler', 'Hatırlatıcılar ve finansal hedefler'],
  '/settings':       ['Ayarlar',           'Hesap ve tercihler'],
  '/admin/catalog':  ['Katalog Yönetimi',  'Abonelik servisleri ve planları'],
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState(() => localStorage.getItem('bt_theme') || 'dark')
  const [telegramOpen, setTelegramOpen] = useState(false)

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'ME'

  // nav items including admin
  const navItems = [
    ...NAV,
    ...(user?.is_admin ? [{ path: '/admin/catalog', label: 'Katalog Yönetimi', icon: Shield, admin: true }] : [])
  ]

  // Apply theme to <html>
  useEffect(() => {
    if (theme === 'light') document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
    localStorage.setItem('bt_theme', theme)
  }, [theme])

  const titles = PAGE_TITLES[location.pathname] || ['Sayfa', '']
  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex min-h-screen relative mesh" style={{ background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside
        className="h-screen sticky top-0 flex flex-col px-4 py-6 shrink-0 z-30"
        style={{
          width: 256,
          background: 'color-mix(in oklab, var(--surface) 70%, transparent)',
          borderRight: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 40%, #000))' }}
          >
            <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 30% 20%, white, transparent 40%)' }} />
            <span className="display font-bold text-white text-[15px] relative">₺</span>
          </div>
          <div>
            <div className="display text-[15px] font-semibold leading-none" style={{ color: 'var(--text)' }}>Bütçe</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>finansal takip</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-left ${isActive ? 'nav-active' : ''}`
                }
                style={({ isActive }) => ({ color: isActive ? 'var(--text)' : 'var(--text-2)' })}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative flex items-center justify-center w-5 h-5">
                      {isActive && (
                        <span
                          className="nav-dot-active absolute -left-[14px] w-1 h-4 rounded-full"
                          style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)' }}
                        />
                      )}
                      <Icon size={18} />
                    </span>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.admin && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                        style={{
                          color: 'var(--accent)',
                          background: 'color-mix(in oklab, var(--accent) 15%, transparent)',
                          border: '1px solid color-mix(in oklab, var(--accent) 30%, transparent)'
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* AI tip card */}
        <div
          className="card-2 p-4 mb-3"
          style={{ background: 'color-mix(in oklab, var(--accent) 10%, var(--surface-2))' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            <div className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Bu ay</div>
          </div>
          <div className="text-[13px] mt-2 leading-snug" style={{ color: 'var(--text)' }}>
            Abonelik harcamalarınızı kontrol altında tutmak için düzenli gözden geçirme yapın.
          </div>
        </div>

        {/* User footer */}
        <div
          className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center display font-semibold text-sm"
            style={{ background: 'oklch(0.32 0.14 280)', color: 'oklch(0.94 0.12 280)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.username}</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--text-3)' }}>{user?.email}</div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg transition"
            style={{ color: 'var(--text-3)' }}
            title="Çıkış"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col" style={{ zIndex: 1 }}>

        {/* Topbar */}
        <header
          className="sticky top-0 z-40 flex items-center gap-4 px-8 py-4 glass"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex-1">
            <div className="mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
              {today}
            </div>
            <h1 className="display text-[22px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              {titles[0]}
            </h1>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Telegram */}
          <button
            onClick={() => setTelegramOpen(true)}
            className="w-10 h-10 rounded-xl relative flex items-center justify-center transition"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
            title="Telegram Bildirimleri"
          >
            <Send size={18} />
          </button>

          {/* New transaction button */}
          <button
            onClick={() => navigate('/add')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl btn-primary font-semibold"
          >
            <Plus size={16} />
            Yeni İşlem
          </button>
        </header>

        {/* Page content */}
        <div key={location.pathname} className="flex-1 rise overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <TelegramModal isOpen={telegramOpen} onClose={() => setTelegramOpen(false)} />
    </div>
  )
}
