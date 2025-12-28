import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { Plus, Trash2, Calendar, CreditCard, CheckCircle2, TrendingUp, Check, X, AlertTriangle, Pencil, Loader2 } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

// Reusable Logo component with multi-URL fallback support
const LogoImage = ({ srcUrls, alt, brandColor, size = 'md' }) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
    const [allFailed, setAllFailed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Normalize srcUrls to always be an array
    const urls = Array.isArray(srcUrls) ? srcUrls : (srcUrls ? [srcUrls] : [])

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-lg',
        lg: 'w-16 h-16 text-xl'
    }

    const handleError = () => {
        if (currentUrlIndex < urls.length - 1) {
            // Try next URL
            setCurrentUrlIndex(prev => prev + 1)
            setIsLoading(true)
        } else {
            // All URLs failed
            setAllFailed(true)
            setIsLoading(false)
        }
    }

    const currentUrl = urls[currentUrlIndex]

    return (
        <div
            className={`${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold text-white overflow-hidden shadow-sm border-2 relative transition-all`}
            style={{
                backgroundColor: (currentUrl && !allFailed) ? '#ffffff' : brandColor,
                borderColor: brandColor
            }}
        >
            {currentUrl && !allFailed ? (
                <>
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-50 animate-pulse z-10 flex items-center justify-center">
                            <div className="w-1/3 h-1/3 rounded-full bg-gray-200"></div>
                        </div>
                    )}
                    <img
                        src={currentUrl}
                        alt={alt}
                        className={`w-3/4 h-3/4 object-contain transition-opacity duration-500 ease-in-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => setIsLoading(false)}
                        onError={handleError}
                    />
                </>
            ) : (
                <span className="animate-in fade-in duration-300 drop-shadow-md">{alt?.charAt(0).toUpperCase() || '?'}</span>
            )}
        </div>
    )
}

export default function Subscriptions() {
    const { authFetch } = useAuth()
    const { darkMode } = useOutletContext()
    const [subscriptions, setSubscriptions] = useState([])
    const [catalog, setCatalog] = useState({})
    const [selectedService, setSelectedService] = useState('')
    const [selectedPlan, setSelectedPlan] = useState('')
    const [customName, setCustomName] = useState('')
    const [customAmount, setCustomAmount] = useState('')
    const [billingDay, setBillingDay] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [useCustom, setUseCustom] = useState(false)
    const [conceptColor, setConceptColor] = useState('#6366f1') // Default Indigo

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingSubscription, setEditingSubscription] = useState(null)
    const [editAmount, setEditAmount] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        fetchSubscriptions()
        fetchCatalog()
    }, [])

    const fetchSubscriptions = async () => {
        try {
            const response = await authFetch(`${API_URL}/subscriptions`)
            const data = await response.json()
            if (data.success) setSubscriptions(data.data)
        } catch (error) { console.error(error) }
    }

    const fetchCatalog = async () => {
        try {
            const response = await fetch(`${API_URL}/subscription-catalog`)
            const data = await response.json()
            if (data.success) setCatalog(data.data)
        } catch (error) { console.error(error) }
    }

    const getBrandDetails = (subName) => {
        if (!subName) return { color: '#6366f1', logoUrls: null }
        const entry = Object.values(catalog).find(c => subName.toLowerCase().includes(c.name.toLowerCase()))
        if (entry) return { color: entry.brandColor, logoUrls: entry.logoUrls, icon: entry.icon }
        return { color: '#6366f1', logoUrls: null, icon: <CreditCard /> }
    }

    const getSelectedPlanDetails = () => {
        if (!selectedService || !selectedPlan) return null
        const service = catalog[selectedService]
        if (!service) return null
        return service.plans.find(p => p.id === selectedPlan)
    }

    const handleServiceSelect = (key) => {
        setSelectedService(key)
        setSelectedPlan('')
        if (catalog[key]) {
            setConceptColor(catalog[key].brandColor)
        }
    }

    const resetForm = () => {
        setSelectedService('')
        setSelectedPlan('')
        setCustomName('')
        setCustomAmount('')
        setBillingDay('')
        setIsAdding(false)
        setUseCustom(false)
        setConceptColor('#6366f1')
    }

    const addSubscription = async (e) => {
        e.preventDefault()
        try {
            let name = customName
            let amount = parseFloat(customAmount)
            let categoryId = null

            if (!useCustom && selectedService && selectedPlan) {
                const service = catalog[selectedService]
                const plan = service.plans.find(p => p.id === selectedPlan)
                name = `${service.name} ${plan.name}`
                amount = plan.amount
                // Kategori ID'si burada eklenebilir eğer katalogda tanımlıysa
            }
            if (!billingDay) return

            const res = await authFetch(`${API_URL}/subscriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, amount, billing_day: parseInt(billingDay), category_id: categoryId })
            })
            const data = await res.json()
            if (data.success) {
                setSubscriptions([...subscriptions, data.data])
                resetForm()
            }
        } catch (error) { console.error(error) }
    }

    const requestDelete = (id) => {
        setItemToDelete(id)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return
        try {
            await authFetch(`${API_URL}/subscriptions/${itemToDelete}`, { method: 'DELETE' })
            setSubscriptions(subscriptions.filter(s => s.id !== itemToDelete))
            setShowDeleteModal(false)
            setItemToDelete(null)
        } catch (error) { console.error(error) }
    }

    const requestEdit = (sub) => {
        setEditingSubscription(sub)
        setEditAmount(sub.amount)
        setShowEditModal(true)
    }

    const handleUpdatePrice = async (e) => {
        e.preventDefault()
        if (!editingSubscription || !editAmount) return

        setIsUpdating(true)
        try {
            const res = await authFetch(`${API_URL}/subscriptions/${editingSubscription.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(editAmount) })
            })
            const data = await res.json()

            if (data.success) {
                // Update local state
                setSubscriptions(subscriptions.map(sub =>
                    sub.id === editingSubscription.id ? { ...sub, amount: parseFloat(editAmount) } : sub
                ))
                setShowEditModal(false)
                setEditingSubscription(null)
                // Optional: Show success toast/notification logic here
            }
        } catch (error) {
            console.error('Update error:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const formatMoney = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)

    const totalMonthlyCost = subscriptions.reduce((sum, sub) => sum + sub.amount, 0)
    const today = new Date().getDate()
    const inputClass = `w-full p-3 rounded-xl outline-none transition-all ${darkMode ? 'bg-black/20 border-white/10 text-white focus:border-[var(--concept-color)]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[var(--concept-color)]'} border focus:ring-1 focus:ring-[var(--concept-color)]`

    return (
        <div className="space-y-8 relative" style={{ '--concept-color': conceptColor }}>

            {/* Ambient Background Glow */}
            <div
                className="fixed inset-0 pointer-events-none opacity-10 transition-colors duration-700 blur-[100px]"
                style={{
                    background: `radial-gradient(circle at 50% 10%, ${conceptColor}, transparent 70%)`,
                    zIndex: 0
                }}
            />

            {/* Custom Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-[#18181b] border border-white/10' : 'bg-white'}`}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Emin misiniz?</h3>
                            <p className={`mb-6 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                                Bu aboneliği iptal etmek üzeresiniz. Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${darkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                                >
                                    Evet, İptal Et
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Abonelikler</h1>
                    <p className={`mt-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Sabit giderlerinizi takip edin</p>
                </div>

                <div className={`px-6 py-3 rounded-2xl flex items-center gap-4 ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-indigo-100 shadow-sm'}`}>
                    <div className={`p-2 rounded-xl bg-[var(--concept-color)]/20 text-[var(--concept-color)]`}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className={`text-sm font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Aylık Sabit Gider</div>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{formatMoney(totalMonthlyCost)}</div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        if (isAdding) resetForm()
                        else setIsAdding(true)
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${isAdding
                        ? (darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                        : 'bg-[var(--concept-color)] text-white hover:brightness-110 shadow-[var(--concept-color)]/30'
                        }`}
                >
                    {isAdding ? <><X size={20} /> Vazgeç</> : <><Plus size={20} /> Yeni Ekle</>}
                </button>
            </div>

            {/* ADD FORM */}
            {isAdding && (
                <form onSubmit={addSubscription} className={`relative z-10 p-6 rounded-3xl border animate-in slide-in-from-top-4 duration-300 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-slate-200 shadow-xl'}`}>

                    {/* Catalog/Custom Toggle */}
                    <div className="flex gap-2 mb-8">
                        <button
                            type="button"
                            onClick={() => { setUseCustom(false); setConceptColor('#6366f1'); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${!useCustom
                                ? 'bg-[var(--concept-color)] border-[var(--concept-color)] text-white'
                                : (darkMode ? 'border-white/10 text-zinc-400 hover:bg-white/5' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                                }`}
                        >
                            Hızlı Seçim Kataloğu
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUseCustom(true); setConceptColor('#6366f1'); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${useCustom
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : (darkMode ? 'border-white/10 text-zinc-400 hover:bg-white/5' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                                }`}
                        >
                            Özel Giriş
                        </button>
                    </div>

                    {!useCustom ? (
                        <div className="space-y-8">
                            {/* Service Selection */}
                            <div>
                                <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>1. Servis Seçin</h3>
                                <div className="flex flex-wrap gap-4">
                                    {Object.entries(catalog).map(([key, service]) => {
                                        const isSelected = selectedService === key
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleServiceSelect(key)}
                                                className={`
                                                    relative group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300
                                                    ${isSelected
                                                        ? `${darkMode ? 'bg-white/10' : 'bg-slate-50'} border-[var(--concept-color)] ring-1 ring-[var(--concept-color)]`
                                                        : `${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`
                                                    }
                                                `}
                                            >
                                                <LogoImage
                                                    srcUrls={service.logoUrls}
                                                    alt={service.name}
                                                    brandColor={service.brandColor}
                                                    size="sm"
                                                />
                                                <div className={`font-semibold ${isSelected ? (darkMode ? 'text-white' : 'text-slate-900') : (darkMode ? 'text-zinc-400' : 'text-slate-500')}`}>
                                                    {service.name}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 text-white rounded-full p-1 shadow-lg" style={{ backgroundColor: service.brandColor }}>
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Plan Selection */}
                            {selectedService && (
                                <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                                    <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>2. Plan Seçin</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {catalog[selectedService].plans.map(plan => {
                                            const isSelected = selectedPlan === plan.id
                                            return (
                                                <button
                                                    key={plan.id}
                                                    type="button"
                                                    onClick={() => setSelectedPlan(plan.id)}
                                                    className={`
                                                        text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group
                                                        ${isSelected
                                                            ? `${darkMode ? 'bg-white/5' : 'bg-white'} border-[var(--concept-color)] ring-1 ring-[var(--concept-color)]`
                                                            : `${darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'}`
                                                        }
                                                    `}
                                                >
                                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--concept-color)]" />}
                                                    <div className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{plan.name}</div>
                                                    <div className={`text-lg font-bold group-hover:scale-105 transition-transform origin-left`} style={{ color: isSelected ? 'var(--concept-color)' : (darkMode ? '#a1a1aa' : '#64748b') }}>
                                                        {formatMoney(plan.amount)}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Billing Day & Submit */}
                            {selectedService && selectedPlan && (
                                <div className="animate-in slide-in-from-top-4 fade-in duration-300 pt-6 border-t border-dashed border-slate-200 dark:border-white/10">
                                    <div className="flex flex-col md:flex-row gap-6 items-end">
                                        <div className="flex-1 w-full relative">
                                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>3. Ödeme Günü (Her ayın kaçı?)</label>
                                            <div className="relative">
                                                <input
                                                    type="number" min="1" max="31" placeholder="1-31" value={billingDay}
                                                    onChange={(e) => setBillingDay(e.target.value)}
                                                    className={inputClass} autoFocus
                                                />
                                                <Calendar className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`} size={18} />
                                            </div>
                                        </div>
                                        <button
                                            type="submit" disabled={!billingDay}
                                            className="h-[52px] px-8 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 hover:brightness-110 disabled:grayscale disabled:opacity-50"
                                            style={{ backgroundColor: 'var(--concept-color)', boxShadow: '0 10px 20px -5px var(--concept-color)' }}
                                        >
                                            <CheckCircle2 size={20} /> Aboneliği Başlat
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Abonelik Adı</label>
                                <input type="text" placeholder="Örn: Gym Üyeliği" value={customName} onChange={(e) => setCustomName(e.target.value)} className={inputClass} autoFocus />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Aylık Tutar</label>
                                <input type="number" placeholder="0.00" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Ödeme Günü</label>
                                <input type="number" min="1" max="31" placeholder="Gün" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className={inputClass} />
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" disabled={!customName || !customAmount || !billingDay} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all">Kaydet</button>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* Subscriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {subscriptions.map(sub => {
                    const isPayDay = sub.billing_day === today
                    const { color, logoUrls, icon } = getBrandDetails(sub.name)

                    return (
                        <div key={sub.id} className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? 'bg-[#161616] border-white/5 hover:border-[var(--card-color)]' : 'bg-white border-slate-200 shadow-sm hover:border-[var(--card-color)]'}`} style={{ '--card-color': color }}>

                            {/* Brand Splat Glow Effect on Hover */}
                            <div className="absolute inset-0 rounded-3xl bg-[var(--card-color)] opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />

                            {isPayDay && (
                                <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                                    ÖDEME GÜNÜ
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-4">
                                    <LogoImage
                                        srcUrls={logoUrls}
                                        alt={sub.name}
                                        brandColor={color}
                                        size="md"
                                    />
                                    <div>
                                        <h3 className={`font-bold text-lg leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{sub.name}</h3>
                                        <div
                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                                            style={{ backgroundColor: `${color}20`, color: color }}
                                        >
                                            HER AYIN {sub.billing_day}. GÜNÜ
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => requestEdit(sub)}
                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                                        title="Fiyatı Düzenle"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => requestDelete(sub.id)}
                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                                        title="Aboneliği Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-xs font-medium mb-0.5 ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Aylık Tutar</div>
                                    <div className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {formatMoney(sub.amount)}
                                    </div>
                                </div>

                                {/* Dynamic Days Left Badge */}
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase opacity-60 mb-0.5" style={{ color: darkMode ? '#a1a1aa' : '#64748b' }}>Kalan Süre</div>
                                    <div
                                        className="inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold text-sm shadow-sm"
                                        style={{ backgroundColor: color, color: '#fff' }}
                                    >
                                        {sub.billing_day > today ? sub.billing_day - today : 30 - (today - sub.billing_day)} GÜN
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {subscriptions.length === 0 && !isAdding && (
                <div className={`text-center py-20 rounded-3xl border border-dashed ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-50'}`}>
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-500'}`}>
                        <CreditCard size={32} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Henüz abonelik eklemediniz</h3>
                    <p className={`${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Sabit giderlerinizi ekleyerek aylık maliyetinizi görün.</p>
                </div>
            )}

            {/* Edit Price Modal */}
            {showEditModal && editingSubscription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-[#18181b] border border-white/10' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-6 border-b border-dashed border-slate-200 dark:border-white/10 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Pencil size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{editingSubscription.name}</h3>
                                    <p className={`text-xs font-medium ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Abonelik Ücretini Güncelle</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePrice}>
                            <div className="mb-6">
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Yeni Tutar (TL)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className={`w-full h-12 px-4 rounded-xl text-lg font-bold outline-none transition-all ${darkMode ? 'bg-black/50 border-white/10 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'} border-2`}
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>TL/AY</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className={`flex-1 h-12 rounded-xl font-bold transition-colors ${darkMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editAmount || isUpdating}
                                    className="flex-1 h-12 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
