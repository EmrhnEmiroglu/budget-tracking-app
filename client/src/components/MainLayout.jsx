import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(true) // Global dark mode state could be in context, but keeping local for now or moving to context later. Defaults to true as per previous preferred style.

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        // You might want to persist this in localStorage or Context
    }

    const navItems = [
        { path: '/', label: 'Özet', icon: '📊' },
        { path: '/transactions', label: 'Hareketler', icon: '📋' },
        { path: '/add', label: 'Ekle', icon: '➕' },
        { path: '/settings', label: 'Ayarlar', icon: '⚙️' }
    ]

    return (
        <div className={`min-h-screen transition-colors flex ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block border-r ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>

                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                            💰 Finans
                        </h1>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                                    ${isActive
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : darkMode ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                                `}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Info */}
                    <div className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.username}</p>
                                <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className={`h-16 lg:hidden flex items-center justify-between px-4 border-b sticky top-0 z-30 backdrop-blur-xl ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-lg">
                        ☰
                    </button>
                    <span className="font-bold">Finans</span>
                    <div className="w-8" /> {/* Spacer */}
                </header>

                <header className={`hidden lg:flex h-16 items-center justify-between px-8 border-b sticky top-0 z-30 backdrop-blur-xl ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                    <h2 className="font-semibold text-lg">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Sayfa'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleDarkMode} className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-slate-900 text-yellow-400 hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button onClick={logout} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-sm font-medium transition-colors">
                            Çıkış Yap
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <Outlet context={{ darkMode }} />
                </main>
            </div>
        </div>
    )
}
