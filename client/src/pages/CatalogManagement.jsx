import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext, Navigate } from 'react-router-dom'
import { Shield, Save, Loader2, CheckCircle2, AlertTriangle, Package, Plus, Trash2, X } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

export default function CatalogManagement() {
    const { authFetch, user } = useAuth()
    const { darkMode } = useOutletContext()
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

    // Admin değilse ana sayfaya yönlendir
    if (!user?.is_admin) {
        return <Navigate to="/" replace />
    }

    useEffect(() => {
        fetchCatalog()
    }, [])

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

    const inputClass = `w-full h-10 px-3 rounded-lg text-sm font-medium outline-none transition-all ${darkMode
        ? 'bg-black/50 border-white/10 focus:border-indigo-500 text-white'
        : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'
        } border`

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                        <Shield size={28} />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Katalog Yönetimi
                        </h1>
                        <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                            Servis ve planları yönetin, yeni abonelikler ekleyin
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddService(!showAddService)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${showAddService
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25'
                        }`}
                >
                    {showAddService ? <X size={18} /> : <Plus size={18} />}
                    {showAddService ? 'İptal' : 'Yeni Servis'}
                </button>
            </div>

            {/* Add New Service Form */}
            {showAddService && (
                <div className={`p-6 rounded-3xl border-2 border-dashed ${darkMode ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-indigo-300 bg-indigo-50'}`}>
                    <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Yeni Abonelik Servisi Ekle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Servis Adı *</label>
                            <input
                                type="text"
                                value={newService.name}
                                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                placeholder="Örn: Disney+"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Domain</label>
                            <input
                                type="text"
                                value={newService.domain}
                                onChange={(e) => setNewService({ ...newService, domain: e.target.value })}
                                placeholder="Örn: disneyplus.com"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Marka Rengi</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={newService.brandColor}
                                    onChange={(e) => setNewService({ ...newService, brandColor: e.target.value })}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={newService.brandColor}
                                    onChange={(e) => setNewService({ ...newService, brandColor: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Logo URL (Opsiyonel)</label>
                            <input
                                type="text"
                                value={newService.logoUrl}
                                onChange={(e) => setNewService({ ...newService, logoUrl: e.target.value })}
                                placeholder="https://..."
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>İlk Plan Adı *</label>
                            <input
                                type="text"
                                value={newService.planName}
                                onChange={(e) => setNewService({ ...newService, planName: e.target.value })}
                                placeholder="Örn: Aylık"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>İlk Plan Fiyatı (TL) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={newService.planAmount}
                                onChange={(e) => setNewService({ ...newService, planAmount: e.target.value })}
                                placeholder="0.00"
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={addNewService}
                            disabled={saving['add-service'] || !newService.name.trim() || !newService.planName.trim() || !newService.planAmount}
                            className="h-10 px-6 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                        >
                            {saving['add-service'] ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            Servisi Ekle
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {success && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={20} />
                    <span className="text-sm font-medium">{success}</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <AlertTriangle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Catalog Table */}
            <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`px-6 py-4 border-b ${darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                        <Package size={20} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Abonelik Planları</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-white/5 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
                            {Object.keys(catalog).length} Servis
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-white/5">
                    {Object.entries(catalog).map(([key, service]) => (
                        <div key={key} className={`p-6 ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'} transition-colors`}>
                            {/* Service Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                                        style={{ backgroundColor: service.brandColor }}
                                    >
                                        {service.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{service.name}</h3>
                                        <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{service.domain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setAddingPlan(addingPlan === key ? null : key)
                                            setNewPlanName('')
                                            setNewPlanAmount('')
                                        }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${addingPlan === key
                                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                            }`}
                                    >
                                        {addingPlan === key ? <X size={16} /> : <Plus size={16} />}
                                        {addingPlan === key ? 'İptal' : 'Yeni Plan'}
                                    </button>
                                    <button
                                        onClick={() => deleteService(key)}
                                        disabled={saving[`del-svc-${key}`]}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                                        title="Servisi Sil"
                                    >
                                        {saving[`del-svc-${key}`] ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Add New Plan Form */}
                            {addingPlan === key && (
                                <div className={`mb-4 p-4 rounded-xl border-2 border-dashed ${darkMode ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-300 bg-emerald-50'}`}>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <div className="flex-1">
                                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Plan Adı</label>
                                            <input
                                                type="text"
                                                value={newPlanName}
                                                onChange={(e) => setNewPlanName(e.target.value)}
                                                placeholder="Örn: Premium, Aile, Öğrenci"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div className="w-full md:w-40">
                                            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>Fiyat (TL)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newPlanAmount}
                                                onChange={(e) => setNewPlanAmount(e.target.value)}
                                                placeholder="0.00"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => addNewPlan(key)}
                                                disabled={saving[`add-${key}`] || !newPlanName.trim() || !newPlanAmount}
                                                className="h-10 px-6 rounded-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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
                                        <div
                                            key={plan.id}
                                            className={`p-4 rounded-xl border ${darkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}
                                        >
                                            {/* Plan Name Input */}
                                            <div className="mb-3">
                                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Plan Adı</label>
                                                <input
                                                    type="text"
                                                    value={plan.name}
                                                    onChange={(e) => handleFieldChange(key, plan.id, 'name', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Price Input */}
                                            <div className="mb-3">
                                                <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Fiyat (TL)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={plan.amount}
                                                    onChange={(e) => handleFieldChange(key, plan.id, 'amount', e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updatePlan(key, plan.id)}
                                                    disabled={isSaving}
                                                    className="flex-1 h-9 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                                                >
                                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                                    Kaydet
                                                </button>
                                                <button
                                                    onClick={() => deletePlan(key, plan.id)}
                                                    disabled={isDeleting || service.plans.length <= 1}
                                                    className="h-9 px-3 rounded-lg font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30"
                                                    title={service.plans.length <= 1 ? 'Son plan silinemez' : 'Planı Sil'}
                                                >
                                                    {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                                </button>
                                            </div>

                                            {/* Plan ID Badge */}
                                            <div className={`mt-2 text-center text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-white/5 text-zinc-600' : 'bg-slate-100 text-slate-400'}`}>
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
