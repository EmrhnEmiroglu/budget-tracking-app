import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Calendar, CreditCard, CheckCircle2, TrendingUp, Check, X, AlertTriangle, Pencil, Loader2 } from 'lucide-react'
import { API_URL } from '../config'

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
                        <div className="absolute inset-0 animate-pulse z-10 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                            <div className="w-1/3 h-1/3 rounded-full" style={{ background: 'var(--border)' }}></div>
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
            }
        } catch (error) {
            console.error('Update error:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const formatMoney = (amount) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)

    const totalMonthlyCost = subscriptions.reduce((sum, sub) => sum + sub.amount, 0)
    const yearlyCost = totalMonthlyCost * 12
    const today = new Date().getDate()

    // Bir aboneliğin ödeme gününe kaç gün kaldığını hesapla (bu ay veya gelecek ay)
    const daysUntilBilling = (billingDay) => {
        if (billingDay >= today) return billingDay - today
        const now = new Date()
        const next = new Date(now.getFullYear(), now.getMonth() + 1, billingDay)
        return Math.round((next - now) / 86400000)
    }

    // Bu hafta (önümüzdeki 7 gün) içinde ödemesi gelen abonelikler
    const dueThisWeek = subscriptions.filter(s => daysUntilBilling(s.billing_day) <= 7)
    const dueThisWeekTotal = dueThisWeek.reduce((sum, s) => sum + s.amount, 0)

    // Ödeme takvimi: ayın gün sayısı ve bu ayın adı
    const nowDate = new Date()
    const daysInMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate()
    const monthLabel = nowDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase()
    const inputClass = "w-full p-3 rounded-xl outline-none transition-all field focus:border-[var(--concept-color)] focus:ring-1 focus:ring-[var(--concept-color)]"
    const labelClass = "block text-sm font-medium mb-2"
    const labelStyle = { color: 'var(--text-2)' }

    return (
        <div className="px-8 py-6 space-y-8 relative rise-stagger" style={{ '--concept-color': conceptColor, maxWidth: 1480, margin: '0 auto' }}>

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
                    <div className="card w-full max-w-md p-6 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'color-mix(in oklab, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Emin misiniz?</h3>
                            <p className="mb-6" style={{ color: 'var(--text-2)' }}>
                                Bu aboneliği iptal etmek üzeresiniz. Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95"
                                    style={{ background: 'var(--danger)', boxShadow: '0 10px 24px -8px var(--danger)' }}
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
                    <h1 className="text-3xl font-bold tracking-tight display" style={{ color: 'var(--text)' }}>Abonelikler</h1>
                    <p className="mt-1" style={{ color: 'var(--text-3)' }}>Sabit giderlerinizi takip edin</p>
                </div>

                <div className="card-2 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="p-2 rounded-xl" style={{ background: 'color-mix(in oklab, var(--concept-color) 18%, transparent)', color: 'var(--concept-color)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Aylık Sabit Gider</div>
                        <div className="text-2xl font-bold mono" style={{ color: 'var(--text)' }}>{formatMoney(totalMonthlyCost)}</div>
                    </div>
                </div>

                <button
                    onClick={() => {
                        if (isAdding) resetForm()
                        else setIsAdding(true)
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-white"
                    style={isAdding
                        ? { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }
                        : { background: 'var(--concept-color)', boxShadow: '0 10px 24px -8px var(--concept-color)' }}
                >
                    {isAdding ? <><X size={20} /> Vazgeç</> : <><Plus size={20} /> Yeni Ekle</>}
                </button>
            </div>

            {/* ÖZET + ÖDEME TAKVİMİ */}
            <div className="relative z-10 grid grid-cols-12 gap-5">

                {/* Aylık abonelik toplamı (geniş kart) */}
                <div
                    className="col-span-12 lg:col-span-8 card p-7 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, color-mix(in oklab, var(--warning) 12%, var(--surface)), var(--surface))' }}
                >
                    <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full dotgrid opacity-20" />
                    <div className="flex items-center justify-between mb-3 relative">
                        <div className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
                            aylık abonelik toplamı
                        </div>
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                            style={{ color: 'var(--warning)', background: 'color-mix(in oklab, var(--warning) 15%, transparent)', border: '1px solid color-mix(in oklab, var(--warning) 30%, transparent)' }}
                        >
                            <CreditCard size={12} /> {subscriptions.length} aktif
                        </span>
                    </div>
                    <div className="flex items-end justify-between gap-6 relative flex-wrap">
                        <div className="mono font-bold leading-none num-glow" style={{ fontSize: 54, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                            {formatMoney(totalMonthlyCost)}
                        </div>
                        <div className="flex items-stretch gap-6">
                            <div className="flex flex-col justify-end pb-1">
                                <div className="mono text-[11px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>yıllık toplam</div>
                                <div className="mono text-xl font-semibold leading-none mt-1" style={{ color: 'var(--text-2)' }}>{formatMoney(yearlyCost)}</div>
                                <div className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>12 ay</div>
                            </div>
                            <div className="w-px" style={{ background: 'var(--border)' }} />
                            <div className="flex flex-col justify-end pb-1">
                                <div className="mono text-[11px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>bu hafta</div>
                                <div className="mono text-xl font-semibold leading-none mt-1" style={{ color: 'var(--text-2)' }}>{formatMoney(dueThisWeekTotal)}</div>
                                <div className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>{dueThisWeek.length} abonelik</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Yeni Abonelik kartı */}
                <div className="col-span-12 lg:col-span-4 card p-6 flex flex-col justify-center">
                    <div className="mono text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-3)' }}>
                        yeni abonelik
                    </div>
                    <button
                        onClick={() => { if (isAdding) resetForm(); else setIsAdding(true) }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all active:scale-[0.98]"
                        style={{ background: 'var(--accent)', boxShadow: '0 10px 28px -10px var(--accent)' }}
                    >
                        <Plus size={18} /> Abonelik Ekle
                    </button>
                    <div className="text-xs mt-3 text-center" style={{ color: 'var(--text-3)' }}>
                        Katalogdan seç veya özel oluştur
                    </div>
                </div>

                {/* Aylık Ödeme Takvimi (tam genişlik) */}
                <div className="col-span-12 card p-6">
                    <div className="mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>{monthLabel}</div>
                    <h2 className="display text-[20px] font-semibold mt-1 mb-6" style={{ color: 'var(--text)' }}>Aylık Ödeme Takvimi</h2>
                    <PaymentTimeline
                        subscriptions={subscriptions}
                        daysInMonth={daysInMonth}
                        today={today}
                        getBrandDetails={getBrandDetails}
                    />
                </div>
            </div>

            {/* ADD FORM */}
            {isAdding && (
                <form onSubmit={addSubscription} className="card relative z-10 p-6 animate-in slide-in-from-top-4 duration-300">

                    {/* Catalog/Custom Toggle */}
                    <div className="flex gap-2 mb-8">
                        <button
                            type="button"
                            onClick={() => { setUseCustom(false); setConceptColor('#6366f1'); }}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                            style={!useCustom
                                ? { background: 'var(--concept-color)', borderColor: 'var(--concept-color)', color: '#fff' }
                                : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                        >
                            Hızlı Seçim Kataloğu
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUseCustom(true); setConceptColor('#6366f1'); }}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                            style={useCustom
                                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
                                : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-2)' }}
                        >
                            Özel Giriş
                        </button>
                    </div>

                    {!useCustom ? (
                        <div className="space-y-8">
                            {/* Service Selection */}
                            <div>
                                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>1. Servis Seçin</h3>
                                <div className="flex flex-wrap gap-4">
                                    {Object.entries(catalog).map(([key, service]) => {
                                        const isSelected = selectedService === key
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleServiceSelect(key)}
                                                className="relative group flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300"
                                                style={isSelected
                                                    ? { background: 'var(--surface-2)', borderColor: 'var(--concept-color)', boxShadow: '0 0 0 1px var(--concept-color)' }
                                                    : { background: 'transparent', borderColor: 'var(--border)' }}
                                            >
                                                <LogoImage
                                                    srcUrls={service.logoUrls}
                                                    alt={service.name}
                                                    brandColor={service.brandColor}
                                                    size="sm"
                                                />
                                                <div className="font-semibold" style={{ color: isSelected ? 'var(--text)' : 'var(--text-2)' }}>
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
                                    <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>2. Plan Seçin</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {catalog[selectedService].plans.map(plan => {
                                            const isSelected = selectedPlan === plan.id
                                            return (
                                                <button
                                                    key={plan.id}
                                                    type="button"
                                                    onClick={() => setSelectedPlan(plan.id)}
                                                    className="text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group"
                                                    style={isSelected
                                                        ? { background: 'var(--surface-2)', borderColor: 'var(--concept-color)', boxShadow: '0 0 0 1px var(--concept-color)' }
                                                        : { background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                                                >
                                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--concept-color)' }} />}
                                                    <div className="font-bold mb-1" style={{ color: 'var(--text)' }}>{plan.name}</div>
                                                    <div className="text-lg font-bold mono group-hover:scale-105 transition-transform origin-left" style={{ color: isSelected ? 'var(--concept-color)' : 'var(--text-2)' }}>
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
                                <div className="animate-in slide-in-from-top-4 fade-in duration-300 pt-6 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                                    <div className="flex flex-col md:flex-row gap-6 items-end">
                                        <div className="flex-1 w-full relative">
                                            <label className={labelClass} style={labelStyle}>3. Ödeme Günü (Her ayın kaçı?)</label>
                                            <div className="relative">
                                                <input
                                                    type="number" min="1" max="31" placeholder="1-31" value={billingDay}
                                                    onChange={(e) => setBillingDay(e.target.value)}
                                                    className={inputClass} style={{ color: 'var(--text)' }} autoFocus
                                                />
                                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} size={18} />
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
                                <label className={labelClass} style={labelStyle}>Abonelik Adı</label>
                                <input type="text" placeholder="Örn: Gym Üyeliği" value={customName} onChange={(e) => setCustomName(e.target.value)} className={inputClass} style={{ color: 'var(--text)' }} autoFocus />
                            </div>
                            <div>
                                <label className={labelClass} style={labelStyle}>Aylık Tutar</label>
                                <input type="number" placeholder="0.00" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className={inputClass} style={{ color: 'var(--text)' }} />
                            </div>
                            <div>
                                <label className={labelClass} style={labelStyle}>Ödeme Günü</label>
                                <input type="number" min="1" max="31" placeholder="Gün" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className={inputClass} style={{ color: 'var(--text)' }} />
                            </div>
                            <div className="md:col-span-3 flex justify-end">
                                <button type="submit" disabled={!customName || !customAmount || !billingDay} className="px-8 py-3 text-white rounded-xl font-bold btn-primary transition-all disabled:opacity-50">Kaydet</button>
                            </div>
                        </div>
                    )}
                </form>
            )}

            {/* Subscriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {subscriptions.map(sub => {
                    const isPayDay = sub.billing_day === today
                    const { color, logoUrls } = getBrandDetails(sub.name)

                    return (
                        <div key={sub.id} className="card group relative p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ '--card-color': color, borderColor: 'var(--border)' }}>

                            {/* Brand Splat Glow Effect on Hover */}
                            <div className="absolute inset-0 rounded-[22px] opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" style={{ background: color }} />

                            {isPayDay && (
                                <div className="absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10" style={{ background: 'var(--danger)' }}>
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
                                        <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text)' }}>{sub.name}</h3>
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
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: 'var(--text-3)' }}
                                        title="Fiyatı Düzenle"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => requestDelete(sub.id)}
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ color: 'var(--text-3)' }}
                                        title="Aboneliği Sil"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-3)' }}>Aylık Tutar</div>
                                    <div className="text-2xl font-bold tracking-tight mono" style={{ color: 'var(--text)' }}>
                                        {formatMoney(sub.amount)}
                                    </div>
                                </div>

                                {/* Dynamic Days Left Badge */}
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase mb-0.5" style={{ color: 'var(--text-3)' }}>Kalan Süre</div>
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
                <div className="text-center py-20 rounded-3xl border border-dashed" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                    <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in oklab, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                        <CreditCard size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Henüz abonelik eklemediniz</h3>
                    <p style={{ color: 'var(--text-3)' }}>Sabit giderlerinizi ekleyerek aylık maliyetinizi görün.</p>
                </div>
            )}

            {/* Edit Price Modal */}
            {showEditModal && editingSubscription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="card w-full max-w-md p-6 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6 border-b border-dashed pb-4" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl" style={{ background: 'color-mix(in oklab, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                                    <Pencil size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{editingSubscription.name}</h3>
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>Abonelik Ücretini Güncelle</p>
                                </div>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 rounded-full transition-colors" style={{ color: 'var(--text-3)', background: 'var(--surface-2)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePrice}>
                            <div className="mb-6">
                                <label className={labelClass} style={labelStyle}>Yeni Tutar (TL)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value)}
                                        className="w-full h-12 px-4 rounded-xl text-lg font-bold mono outline-none transition-all field"
                                        style={{ color: 'var(--text)' }}
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--text-3)' }}>TL/AY</div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 h-12 rounded-xl font-bold transition-colors"
                                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editAmount || isUpdating}
                                    className="flex-1 h-12 rounded-xl font-bold text-white shadow-lg btn-primary active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

// Aylık ödeme takvimi — abonelikleri ödeme günlerine göre yatay zaman çizelgesine yerleştirir
function PaymentTimeline({ subscriptions, daysInMonth, today, getBrandDetails }) {
    // Fareyle üstüne gelinen abonelik (tooltip için)
    const [hovered, setHovered] = useState(null)

    const fmtTL = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

    // Bir aboneliğin ödeme gününe kaç gün kaldığını metin olarak ver
    const daysLeftText = (billingDay) => {
        if (billingDay === today) return 'bugün ödenecek'
        let diff = billingDay - today
        if (diff < 0) diff += daysInMonth
        return `${diff} gün sonra`
    }

    // Gün -> yatay yüzde konum
    const posPct = (day) => ((day - 1) / (daysInMonth - 1)) * 100

    // Aynı güne denk gelen abonelikleri grupla (üst üste binmesin)
    const byDay = {}
    subscriptions.forEach(s => {
        const d = s.billing_day
        if (!byDay[d]) byDay[d] = []
        byDay[d].push(s)
    })

    const ticks = [1, 5, 10, 15, 20, 25, daysInMonth].filter((v, i, a) => a.indexOf(v) === i)

    if (subscriptions.length === 0) {
        return (
            <div className="text-sm py-6 text-center" style={{ color: 'var(--text-3)' }}>
                Henüz abonelik yok. Eklediğinizde ödeme günleri burada görünecek.
            </div>
        )
    }

    return (
        <div className="relative" style={{ paddingTop: 8, paddingBottom: 28 }}>
            {/* Abonelik rozetleri (çizginin üstünde) */}
            <div className="relative" style={{ height: 44 }}>
                {Object.entries(byDay).map(([day, subs]) => (
                    <div
                        key={day}
                        className="absolute flex flex-col items-center gap-1"
                        style={{ left: `${posPct(parseInt(day))}%`, transform: 'translateX(-50%)', bottom: 0 }}
                    >
                        <div className="flex -space-x-1.5">
                            {subs.slice(0, 3).map((s) => {
                                const brand = getBrandDetails(s.name)
                                const isHovered = hovered?.id === s.id
                                return (
                                    <div
                                        key={s.id}
                                        onMouseEnter={() => setHovered(s)}
                                        onMouseLeave={() => setHovered(null)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md cursor-pointer transition-transform"
                                        style={{
                                            background: brand.color,
                                            border: '2px solid var(--surface)',
                                            transform: isHovered ? 'translateY(-3px) scale(1.1)' : 'none',
                                            zIndex: isHovered ? 20 : 'auto',
                                        }}
                                    >
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                )
                            })}
                            {subs.length > 3 && (
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-md"
                                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '2px solid var(--surface)' }}>
                                    +{subs.length - 3}
                                </div>
                            )}
                        </div>

                        {/* Tooltip — bu güne ait, üstüne gelinen abonelik */}
                        {hovered && subs.some(x => x.id === hovered.id) && (
                            <div
                                className="absolute left-1/2 -translate-x-1/2 z-30 px-3 py-2 rounded-xl whitespace-nowrap pointer-events-none rise"
                                style={{
                                    bottom: 'calc(100% + 8px)',
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                                }}
                            >
                                <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{hovered.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="mono text-[13px] font-bold" style={{ color: getBrandDetails(hovered.name).color }}>
                                        {fmtTL(hovered.amount)}
                                    </span>
                                    <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                                        · her ayın {hovered.billing_day}. günü
                                    </span>
                                </div>
                                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>
                                    {daysLeftText(hovered.billing_day)}
                                </div>
                                {/* Alt ok */}
                                <div
                                    className="absolute left-1/2 -translate-x-1/2"
                                    style={{
                                        top: '100%', width: 0, height: 0,
                                        borderLeft: '6px solid transparent',
                                        borderRight: '6px solid transparent',
                                        borderTop: '6px solid var(--surface)',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Zaman çizgisi */}
            <div className="relative" style={{ height: 2, background: 'var(--border)', borderRadius: 2 }}>
                {/* Gün işaretleri */}
                {Object.keys(byDay).map((day) => (
                    <div
                        key={day}
                        className="absolute"
                        style={{ left: `${posPct(parseInt(day))}%`, top: -3, transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }}
                    />
                ))}

                {/* Bugün işareti */}
                {today >= 1 && today <= daysInMonth && (
                    <div className="absolute" style={{ left: `${posPct(today)}%`, top: -34, transform: 'translateX(-50%)' }}>
                        <div
                            className="mono text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                            bugün · {today}
                        </div>
                        <div className="mx-auto" style={{ width: 2, height: 40, background: 'color-mix(in oklab, var(--accent) 60%, transparent)', marginTop: 2 }} />
                    </div>
                )}
            </div>

            {/* Gün etiketleri */}
            <div className="relative mt-2" style={{ height: 16 }}>
                {ticks.map((t) => (
                    <div
                        key={t}
                        className="absolute mono text-[11px]"
                        style={{ left: `${posPct(t)}%`, transform: 'translateX(-50%)', color: 'var(--text-3)' }}
                    >
                        {t}
                    </div>
                ))}
            </div>
        </div>
    )
}
