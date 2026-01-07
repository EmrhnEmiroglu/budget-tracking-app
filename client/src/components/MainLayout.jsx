import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Receipt, PlusCircle, Settings, LogOut, Moon, Sun, Wallet, StickyNote, CreditCard, Shield, Send } from 'lucide-react'
import TelegramSettings from './TelegramSettings'

export default function MainLayout() {
    const { user, logout, authFetch } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const [showTelegramModal, setShowTelegramModal] = useState(false)

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
    }

    const navItems = [
        { path: '/', label: 'Özet', icon: <LayoutDashboard size={20} /> },
        { path: '/transactions', label: 'Hareketler', icon: <Receipt size={20} /> },
        { path: '/add', label: 'Ekle', icon: <PlusCircle size={20} /> },
        { path: '/subscriptions', label: 'Abonelikler', icon: <CreditCard size={20} /> },
        { path: '/notes', label: 'Notlar & Hedefler', icon: <StickyNote size={20} /> },
        { path: '/settings', label: 'Ayarlar', icon: <Settings size={20} /> },
        // Admin-only nav item
        ...(user?.is_admin ? [{ path: '/admin/catalog', label: 'Katalog Yönetimi', icon: <Shield size={20} />, isAdmin: true }] : [])
    ]

    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:block border-r ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-slate-50 border-slate-200'}`}>

                <div className="h-full flex flex-col p-6">
                    {/* Logo */}
                    <div className="h-12 flex items-center gap-3 mb-10 px-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                            <Wallet size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Finans</h1>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium text-sm group relative
                                    ${isActive
                                        ? darkMode ? 'text-white' : 'text-slate-900'
                                        : darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-900'}
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${darkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`} />
                                        )}
                                        <span className={isActive ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : ''}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Info */}
                    <div className={`mt-auto pt-6 border-t ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{user?.username}</p>
                                <p className={`text-xs truncate ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className={`h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 transition-colors ${darkMode ? 'bg-[#0a0a0a]/80 backdrop-blur-xl' : 'bg-slate-50/80 backdrop-blur-xl'}`}>
                    <div className="flex items-center gap-4 lg:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2">
                            <LayoutDashboard size={24} />
                        </button>
                    </div>

                    <h2 className="hidden lg:block font-bold text-xl tracking-tight">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Sayfa'}
                    </h2>

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={() => setShowTelegramModal(true)}
                            className={`p-2.5 rounded-full transition-all border ${darkMode ? 'bg-white/5 border-white/5 text-sky-400 hover:bg-sky-500/10' : 'bg-white border-slate-200 text-sky-500 hover:bg-sky-50 shadow-sm'}`}
                            title="Telegram Bildirimleri"
                        >
                            <Send size={18} />
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2.5 rounded-full transition-all border ${darkMode ? 'bg-white/5 border-white/5 text-yellow-400 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'}`}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button
                            onClick={logout}
                            className={`p-2.5 rounded-full transition-all border ${darkMode ? 'bg-white/5 border-white/5 text-rose-400 hover:bg-rose-500/10' : 'bg-white border-slate-200 text-rose-500 hover:bg-rose-50 shadow-sm'}`}
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 px-6 lg:px-10 pb-10 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet context={{ darkMode }} />
                    </div>
                </main>
            </div>

            {/* Telegram Settings Modal */}
            <TelegramSettings
                isOpen={showTelegramModal}
                onClose={() => setShowTelegramModal(false)}
                darkMode={darkMode}
                authFetch={authFetch}
            />
        </div>
    )
}
