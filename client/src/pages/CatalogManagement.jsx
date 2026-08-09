import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { Shield, Save, Loader2, CheckCircle2, AlertTriangle, Package, Plus, Trash2, X, Send } from 'lucide-react'
import { API_URL } from '../config'

export default function CatalogManagement() {
    const { authFetch, user } = useAuth()
    const [catalog, setCatalog] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})
    const [success, setSuccess] = useState(null)
    const [error, setError] = useState(null)

    // Yeni plan ekleme state'leri
    const [addingPlan, setAddingPlan] = useState(null) // serviceKey
    const [newPlanName, setNewPlanName] = useState('')
    const [newPlanAmount, setNewPlanAmount] = useState('')

    // Yeni servis ekleme state'leri
    const [showAddService, setShowAddService] = useState(false)
    const [newService, setNewService] = useState({
        name: '',
        domain: '',
        brandColor: '#6366f1',
        logoUrl: '',
        planName: '',
        planAmount: ''
    })

    useEffect(() => {
        fetchCatalog()
    }, [])

    // Admin değilse ana sayfaya yönlendir
    if (!user?.is_admin) {
        return <Navigate to="/" replace />
    }

    const fetchCatalog = async () => {
        try {
            const response = await fetch(`${API_URL}/subscription-catalog`)
            const data = await response.json()
            if (data.success) setCatalog(data.data)
        } catch (error) {
            console.error('Katalog yüklenemedi:', error)
            setError('Katalog yüklenirken bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const saveCatalog = async (updatedCatalog, successMessage) => {
        try {
            const res = await authFetch(`${API_URL}/admin/update-catalog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ catalog: updatedCatalog })
            })

            const data = await res.json()

            if (data.success) {
                setCatalog(updatedCatalog)
                setSuccess(successMessage)
                setTimeout(() => setSuccess(null), 3000)
                return true
            } else {
                setError(data.error || 'Güncelleme başarısız')
                return false
            }
        } catch (error) {
            console.error('Kaydetme hatası:', error)
            setError('Katalog kaydedilirken bir hata oluştu')
            return false
        }
    }

    const updatePlan = async (serviceKey, planId) => {
        const savingKey = `${serviceKey}-${planId}`
        setSaving(prev => ({ ...prev, [savingKey]: true }))
        setSuccess(null)
        setError(null)

        const service = catalog[serviceKey]
        const plan = service.plans.find(p => p.id === planId)

        await saveCatalog(catalog, `${service.name} - ${plan.name} güncellendi!`)
        setSaving(prev => ({ ...prev, [savingKey]: false }))
    }

    const handleFieldChange = (serviceKey, planId, field, value) => {
        setCatalog(prev => {
            const updated = JSON.parse(JSON.stringify(prev)) // Deep clone
            const planIndex = updated[serviceKey].plans.findIndex(p => p.id === planId)
            if (planIndex !== -1) {
                updated[serviceKey].plans[planIndex][field] = field === 'amount' ? value : value
            }
            return updated
        })
    }

    const addNewPlan = async (serviceKey) => {
        if (!newPlanName.trim() || !newPlanAmount) return

        setSaving(prev => ({ ...prev, [`add-${serviceKey}`]: true }))
        setSuccess(null)
        setError(null)

        const updatedCatalog = JSON.parse(JSON.stringify(catalog))
        const service = updatedCatalog[serviceKey]

        // Yeni plan ID oluştur
        const newPlanId = `${serviceKey}_${newPlanName.toLowerCase().replace(/\s+/g, '_')}`

        // Plan zaten var mı kontrol et
        if (service.plans.some(p => p.id === newPlanId)) {
            setError('Bu isimde bir plan zaten var!')
            setSaving(prev => ({ ...prev, [`add-${serviceKey}`]: false }))
            return
        }

        service.plans.push({
            id: newPlanId,
            name: newPlanName.trim(),
            amount: parseFloat(newPlanAmount)
        })

        const success = await saveCatalog(updatedCatalog, `${service.name} - ${newPlanName} planı eklendi!`)

        if (success) {
            setAddingPlan(null)
            setNewPlanName('')
            setNewPlanAmount('')
        }

        setSaving(prev => ({ ...prev, [`add-${serviceKey}`]: false }))
    }

    const deletePlan = async (serviceKey, planId) => {
        if (!confirm('Bu planı silmek istediğinizden emin misiniz?')) return

        setSaving(prev => ({ ...prev, [`del-${planId}`]: true }))

        const updatedCatalog = JSON.parse(JSON.stringify(catalog))
        const service = updatedCatalog[serviceKey]
        const planName = service.plans.find(p => p.id === planId)?.name

        updatedCatalog[serviceKey].plans = service.plans.filter(p => p.id !== planId)

        await saveCatalog(updatedCatalog, `${service.name} - ${planName} planı silindi!`)
        setSaving(prev => ({ ...prev, [`del-${planId}`]: false }))
    }

    const addNewService = async () => {
        if (!newService.name.trim() || !newService.planName.trim() || !newService.planAmount) {
            setError('Servis adı, plan adı ve fiyat gereklidir')
            return
        }

        setSaving(prev => ({ ...prev, 'add-service': true }))
        setSuccess(null)
        setError(null)

        const serviceKey = newService.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

        // Servis zaten var mı?
        if (catalog[serviceKey]) {
            setError('Bu isimde bir servis zaten var!')
            setSaving(prev => ({ ...prev, 'add-service': false }))
            return
        }

        const updatedCatalog = {
            ...catalog,
            [serviceKey]: {
                name: newService.name.trim(),
                domain: newService.domain.trim() || `${serviceKey}.com`,
                brandColor: newService.brandColor,
                logoUrls: newService.logoUrl.trim() ? [newService.logoUrl.trim()] : [],
                plans: [{
                    id: `${serviceKey}_${newService.planName.toLowerCase().replace(/\s+/g, '_')}`,
                    name: newService.planName.trim(),
                    amount: parseFloat(newService.planAmount)
                }]
            }
        }

        const success = await saveCatalog(updatedCatalog, `${newService.name} servisi eklendi!`)

        if (success) {
            setShowAddService(false)
            setNewService({ name: '', domain: '', brandColor: '#6366f1', logoUrl: '', planName: '', planAmount: '' })
        }

        setSaving(prev => ({ ...prev, 'add-service': false }))
    }

    const deleteService = async (serviceKey) => {
        if (!confirm(`${catalog[serviceKey].name} servisini silmek istediğinizden emin misiniz?`)) return

        setSaving(prev => ({ ...prev, [`del-svc-${serviceKey}`]: true }))

        const serviceName = catalog[serviceKey].name
        const updatedCatalog = { ...catalog }
        delete updatedCatalog[serviceKey]

        await saveCatalog(updatedCatalog, `${serviceName} servisi silindi!`)
        setSaving(prev => ({ ...prev, [`del-svc-${serviceKey}`]: false }))
    }

    const inputClass = "w-full h-10 px-3 rounded-lg text-sm font-medium outline-none transition-all field"
    const labelClass = "block text-[10px] uppercase tracking-[0.12em] mono font-medium mb-1"
    const labelStyle = { color: 'var(--text-3)' }

    const testTelegram = async () => {
        setSaving(prev => ({ ...prev, 'test-telegram': true }))
        try {
            const response = await authFetch(`${API_URL}/admin/test-telegram`)
            const data = await response.json()
            if (data.success) {
                setSuccess('Telegram testi başarılı!')
            } else {
                setError(data.error || 'Test başarısız')
            }
        } catch (err) {
            setError('Test hatası: ' + err.message)
        }
        setSaving(prev => ({ ...prev, 'test-telegram': false }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent)' }} />
            </div>
        )
    }

    return (
        <div className="px-8 py-6 space-y-8 rise-stagger" style={{ maxWidth: 1480, margin: '0 auto' }}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl" style={{ background: 'color-mix(in oklab, var(--warning) 14%, transparent)', color: 'var(--warning)' }}>
                        <Shield size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold display" style={{ color: 'var(--text)' }}>
                            Katalog Yönetimi
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                            Servis ve planları yönetin, yeni abonelikler ekleyin
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={testTelegram}
                        disabled={saving['test-telegram']}
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all border disabled:opacity-50"
                        style={{ background: 'color-mix(in oklab, #38BDF8 12%, transparent)', color: '#38BDF8', borderColor: 'color-mix(in oklab, #38BDF8 25%, transparent)' }}
                    >
                        {saving['test-telegram'] ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
                        Telegram Test
                    </button>
                    <button
                        onClick={() => setShowAddService(!showAddService)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all text-white"
                        style={showAddService
                            ? { background: 'color-mix(in oklab, var(--danger) 14%, transparent)', color: 'var(--danger)' }
                            : { background: 'var(--accent)', boxShadow: '0 8px 22px -10px var(--accent)' }}
                    >
                        {showAddService ? <X size={18} /> : <Plus size={18} />}
                        {showAddService ? 'İptal' : 'Yeni Servis'}
                    </button>
                </div>
            </div>

            {/* Add New Service Form */}
            {showAddService && (
                <div className="p-6 rounded-3xl border-2 border-dashed" style={{ borderColor: 'color-mix(in oklab, var(--accent) 30%, transparent)', background: 'color-mix(in oklab, var(--accent) 5%, var(--surface))' }}>
                    <h3 className="font-bold mb-4 display" style={{ color: 'var(--text)' }}>Yeni Abonelik Servisi Ekle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass} style={labelStyle}>Servis Adı *</label>
                            <input type="text" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} placeholder="Örn: Disney+" className={inputClass} style={{ color: 'var(--text)' }} />
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>Domain</label>
                            <input type="text" value={newService.domain} onChange={(e) => setNewService({ ...newService, domain: e.target.value })} placeholder="Örn: disneyplus.com" className={inputClass} style={{ color: 'var(--text)' }} />
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>Marka Rengi</label>
                            <div className="flex gap-2">
                                <input type="color" value={newService.brandColor} onChange={(e) => setNewService({ ...newService, brandColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 shrink-0" />
                                <input type="text" value={newService.brandColor} onChange={(e) => setNewService({ ...newService, brandColor: e.target.value })} className={inputClass} style={{ color: 'var(--text)' }} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>Logo URL (Opsiyonel)</label>
                            <input type="text" value={newService.logoUrl} onChange={(e) => setNewService({ ...newService, logoUrl: e.target.value })} placeholder="https://..." className={inputClass} style={{ color: 'var(--text)' }} />
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>İlk Plan Adı *</label>
                            <input type="text" value={newService.planName} onChange={(e) => setNewService({ ...newService, planName: e.target.value })} placeholder="Örn: Aylık" className={inputClass} style={{ color: 'var(--text)' }} />
                        </div>
                        <div>
                            <label className={labelClass} style={labelStyle}>İlk Plan Fiyatı (TL) *</label>
                            <input type="number" step="0.01" value={newService.planAmount} onChange={(e) => setNewService({ ...newService, planAmount: e.target.value })} placeholder="0.00" className={inputClass + " mono"} style={{ color: 'var(--text)' }} />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={addNewService}
                            disabled={saving['add-service'] || !newService.name.trim() || !newService.planName.trim() || !newService.planAmount}
                            className="h-10 px-6 rounded-xl font-medium text-white btn-primary active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving['add-service'] ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            Servisi Ekle
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {success && (
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'color-mix(in oklab, var(--success) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--success) 25%, transparent)', color: 'var(--success)' }}>
                    <CheckCircle2 size={20} />
                    <span className="text-sm font-medium">{success}</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'color-mix(in oklab, var(--danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)', color: 'var(--danger)' }}>
                    <AlertTriangle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Catalog Table */}
            <div className="card overflow-hidden" style={{ padding: 0 }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                    <div className="flex items-center gap-3">
                        <Package size={20} style={{ color: 'var(--accent)' }} />
                        <span className="font-bold" style={{ color: 'var(--text)' }}>Abonelik Planları</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                            {Object.keys(catalog).length} Servis
                        </span>
                    </div>
                </div>

                <div>
                    {Object.entries(catalog).map(([key, service]) => (
                        <div key={key} className="p-6 transition-colors" style={{ borderTop: '1px solid var(--border)' }}>
                            {/* Service Header */}
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: service.brandColor }}
                                    >
                                        {service.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold" style={{ color: 'var(--text)' }}>{service.name}</h3>
                                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{service.domain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setAddingPlan(addingPlan === key ? null : key)
                                            setNewPlanName('')
                                            setNewPlanAmount('')
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                                        style={addingPlan === key
                                            ? { background: 'color-mix(in oklab, var(--danger) 12%, transparent)', color: 'var(--danger)' }
                                            : { background: 'color-mix(in oklab, var(--success) 12%, transparent)', color: 'var(--success)' }}
                                    >
                                        {addingPlan === key ? <X size={16} /> : <Plus size={16} />}
                                        {addingPlan === key ? 'İptal' : 'Yeni Plan'}
                                    </button>
                                    <button
                                        onClick={() => deleteService(key)}
                                        disabled={saving[`del-svc-${key}`]}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                        style={{ background: 'color-mix(in oklab, var(--danger) 12%, transparent)', color: 'var(--danger)' }}
                                        title="Servisi Sil"
                                    >
                                        {saving[`del-svc-${key}`] ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Add New Plan Form */}
                            {addingPlan === key && (
                                <div className="mb-4 p-4 rounded-xl border-2 border-dashed" style={{ borderColor: 'color-mix(in oklab, var(--success) 30%, transparent)', background: 'color-mix(in oklab, var(--success) 5%, var(--surface))' }}>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <label className={labelClass} style={labelStyle}>Plan Adı</label>
                                            <input type="text" value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Örn: Premium, Aile, Öğrenci" className={inputClass} style={{ color: 'var(--text)' }} />
                                        </div>
                                        <div className="w-full md:w-40">
                                            <label className={labelClass} style={labelStyle}>Fiyat (TL)</label>
                                            <input type="number" step="0.01" value={newPlanAmount} onChange={(e) => setNewPlanAmount(e.target.value)} placeholder="0.00" className={inputClass + " mono"} style={{ color: 'var(--text)' }} />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => addNewPlan(key)}
                                                disabled={saving[`add-${key}`] || !newPlanName.trim() || !newPlanAmount}
                                                className="h-10 px-6 rounded-lg font-medium text-white active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                                style={{ background: 'var(--success)' }}
                                            >
                                                {saving[`add-${key}`] ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                Ekle
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Plans Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {service.plans.map(plan => {
                                    const savingKey = `${key}-${plan.id}`
                                    const isSaving = saving[savingKey]
                                    const isDeleting = saving[`del-${plan.id}`]

                                    return (
                                        <div key={plan.id} className="card-2 p-4">
                                            {/* Plan Name Input */}
                                            <div className="mb-3">
                                                <label className={labelClass} style={labelStyle}>Plan Adı</label>
                                                <input type="text" value={plan.name} onChange={(e) => handleFieldChange(key, plan.id, 'name', e.target.value)} className={inputClass} style={{ color: 'var(--text)' }} />
                                            </div>

                                            {/* Price Input */}
                                            <div className="mb-3">
                                                <label className={labelClass} style={labelStyle}>Fiyat (TL)</label>
                                                <input type="number" step="0.01" value={plan.amount} onChange={(e) => handleFieldChange(key, plan.id, 'amount', e.target.value)} className={inputClass + " mono"} style={{ color: 'var(--text)' }} />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updatePlan(key, plan.id)}
                                                    disabled={isSaving}
                                                    className="flex-1 h-9 rounded-lg font-medium text-white btn-primary active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                                >
                                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                                    Kaydet
                                                </button>
                                                <button
                                                    onClick={() => deletePlan(key, plan.id)}
                                                    disabled={isDeleting || service.plans.length <= 1}
                                                    className="h-9 px-3 rounded-lg font-medium active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                                                    style={{ background: 'color-mix(in oklab, var(--danger) 12%, transparent)', color: 'var(--danger)' }}
                                                    title={service.plans.length <= 1 ? 'Son plan silinemez' : 'Planı Sil'}
                                                >
                                                    {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                                </button>
                                            </div>

                                            {/* Plan ID Badge */}
                                            <div className="mt-2 text-center text-xs px-2 py-1 rounded-full mono" style={{ background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                                                ID: {plan.id}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
