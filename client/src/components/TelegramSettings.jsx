import { useState, useEffect } from 'react'
import { X, Send, Bell, Target, BarChart3, Copy, Check, Unlink, RefreshCw } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

export default function TelegramSettings({ isOpen, onClose, darkMode, authFetch }) {
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [linkCode, setLinkCode] = useState(null)
    const [copied, setCopied] = useState(false)
    const [saving, setSaving] = useState(false)
    const [disconnecting, setDisconnecting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchStatus()
        }
    }, [isOpen])

    const fetchStatus = async () => {
        try {
            setLoading(true)
            const response = await authFetch(`${API_URL}/telegram/status`)
            const data = await response.json()
            if (data.success) {
                setStatus(data.data)
            }
        } catch (error) {
            console.error('Telegram durum hatası:', error)
        } finally {
            setLoading(false)
        }
    }

    const generateCode = async () => {
        try {
            const response = await authFetch(`${API_URL}/telegram/generate-code`, {
                method: 'POST'
            })
            const data = await response.json()
            if (data.success) {
                setLinkCode(data.data)
            }
        } catch (error) {
            console.error('Kod oluşturma hatası:', error)
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
            const response = await authFetch(`${API_URL}/telegram/preferences`, {
                method: 'PUT',
                body: JSON.stringify(newPrefs)
            })
            const data = await response.json()
            if (data.success) {
                setStatus(prev => ({ ...prev, preferences: newPrefs }))
            }
        } catch (error) {
            console.error('Tercih güncelleme hatası:', error)
        } finally {
            setSaving(false)
        }
    }

    const disconnect = async () => {
        if (!confirm('Telegram bağlantısını kesmek istediğinize emin misiniz?')) return

        try {
            setDisconnecting(true)
            const response = await authFetch(`${API_URL}/telegram/disconnect`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                setStatus(prev => ({ ...prev, connected: false }))
                setLinkCode(null)
            }
        } catch (error) {
            console.error('Bağlantı kesme hatası:', error)
        } finally {
            setDisconnecting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                            <Send size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                Telegram Bildirimleri
                            </h2>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {status?.connected ? '✅ Bağlı' : '⚪ Bağlı değil'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                            }`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw size={24} className={`animate-spin ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                    ) : status?.connected ? (
                        /* Connected State - Show Preferences */
                        <>
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                                <p className={`text-sm font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                    ✅ Telegram hesabın bağlı! Aşağıdan bildirim tercihlerini ayarlayabilirsin.
                                </p>
                            </div>

                            {/* Notification Toggles */}
                            <div className="space-y-3">
                                <h3 className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Bildirim Tercihleri
                                </h3>

                                {/* Subscription Reminders */}
                                <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            <Bell size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Abonelik Hatırlatma
                                            </p>
                                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Ödeme günlerinde bildirim
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('subscriptions', !status.preferences.subscriptions)}
                                        disabled={saving}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${status.preferences.subscriptions
                                            ? 'bg-emerald-500'
                                            : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${status.preferences.subscriptions ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>

                                {/* Goal Reminders */}
                                <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${darkMode ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-100 text-violet-600'
                                            }`}>
                                            <Target size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Hedef Hatırlatma
                                            </p>
                                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Son tarihlerde bildirim
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('goals', !status.preferences.goals)}
                                        disabled={saving}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${status.preferences.goals
                                            ? 'bg-emerald-500'
                                            : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${status.preferences.goals ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>

                                {/* Weekly Summary */}
                                <div className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${darkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'
                                            }`}>
                                            <BarChart3 size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                                Haftalık Özet
                                            </p>
                                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Her pazartesi bakiye özeti
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('weeklySummary', !status.preferences.weeklySummary)}
                                        disabled={saving}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${status.preferences.weeklySummary
                                            ? 'bg-emerald-500'
                                            : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${status.preferences.weeklySummary ? 'translate-x-6' : 'translate-x-0.5'
                                            }`} />
                                    </button>
                                </div>
                            </div>

                            {/* Disconnect Button */}
                            <button
                                onClick={disconnect}
                                disabled={disconnecting}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${darkMode
                                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                    }`}
                            >
                                <Unlink size={16} />
                                {disconnecting ? 'Bağlantı kesiliyor...' : 'Bağlantıyı Kes'}
                            </button>
                        </>
                    ) : (
                        /* Not Connected State - Show Link Instructions */
                        <>
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-sky-500/10 border border-sky-500/20' : 'bg-sky-50 border border-sky-200'}`}>
                                <p className={`text-sm ${darkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                                    Telegram'dan bildirim almak için hesabını bağla.
                                </p>
                            </div>

                            {/* Steps */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                        }`}>1</div>
                                    <div>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Bağlantı kodu al
                                        </p>
                                        {!linkCode ? (
                                            <button
                                                onClick={generateCode}
                                                className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                            >
                                                Kod Oluştur
                                            </button>
                                        ) : (
                                            <div className={`mt-2 flex items-center gap-2 p-3 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-100'
                                                }`}>
                                                <code className={`flex-1 font-mono text-lg font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'
                                                    }`}>
                                                    {linkCode.code}
                                                </code>
                                                <button
                                                    onClick={copyCode}
                                                    className={`p-2 rounded-lg transition-colors ${copied
                                                        ? 'bg-emerald-500 text-white'
                                                        : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                        }`}
                                                >
                                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                        }`}>2</div>
                                    <div>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Telegram botu aç
                                        </p>
                                        {linkCode?.botUsername ? (
                                            <a
                                                href={`https://t.me/${linkCode.botUsername}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-2 mt-2 text-sm ${darkMode ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'
                                                    }`}
                                            >
                                                <Send size={14} />
                                                @{linkCode.botUsername}
                                            </a>
                                        ) : (
                                            <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Önce kod oluştur
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                                        }`}>3</div>
                                    <div>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                            Bota kodu gönder
                                        </p>
                                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {linkCode ? (
                                                <code className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                    /baglan {linkCode.code}
                                                </code>
                                            ) : (
                                                'Önce kod oluştur'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Refresh Button */}
                            {linkCode && (
                                <button
                                    onClick={fetchStatus}
                                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${darkMode
                                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <RefreshCw size={16} />
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
