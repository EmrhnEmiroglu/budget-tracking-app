import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config'
import { TrendingUp, TrendingDown, Check } from 'lucide-react'
import { Card } from '../components/ui'

export default function AddTransaction() {
    const { authFetch } = useAuth()
    const navigate = useNavigate()

    const today = new Date().toISOString().split('T')[0]

    const [categories, setCategories] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: today,
        category_id: '',
        transactionType: 'Gider' // 'Gelir' or 'Gider'
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await authFetch(`${API_URL}/categories`)
            const data = await response.json()
            if (data.success) setCategories(data.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.amount || !formData.category_id) return alert('Tutar ve kategori zorunludur')

        try {
            setSubmitting(true)
            const response = await authFetch(`${API_URL}/expenses`, {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    category_id: parseInt(formData.category_id)
                })
            })
            const data = await response.json()

            if (data.success) {
                navigate('/transactions') // Redirect to list after add
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const filteredCategories = categories.filter(c => c.type === formData.transactionType)
    const isIncome = formData.transactionType === 'Gelir'

    const labelCls = "block text-[10px] uppercase tracking-[0.15em] mono mb-1.5"
    const labelStyle = { color: 'var(--text-3)' }
    const inputCls = "w-full field px-4 py-3 text-sm outline-none transition-all"

    return (
        <div className="px-8 py-6 rise-stagger" style={{ maxWidth: 720, margin: '0 auto' }}>
            <Card pad="p-6">
                {/* Type Toggle */}
                <div className="toggle-pill w-full grid grid-cols-2 gap-1.5 mb-6">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, transactionType: 'Gelir', category_id: '' })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                            background: isIncome ? 'var(--success)' : 'transparent',
                            color: isIncome ? 'white' : 'var(--text-2)',
                            boxShadow: isIncome ? '0 6px 20px -8px var(--success)' : 'none',
                        }}
                    >
                        <TrendingUp size={16} /> Gelir
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, transactionType: 'Gider', category_id: '' })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                            background: !isIncome ? 'var(--danger)' : 'transparent',
                            color: !isIncome ? 'white' : 'var(--text-2)',
                            boxShadow: !isIncome ? '0 6px 20px -8px var(--danger)' : 'none',
                        }}
                    >
                        <TrendingDown size={16} /> Gider
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelCls} style={labelStyle}>Tutar</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 mono" style={{ color: 'var(--text-3)' }}>₺</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full field pl-9 pr-4 py-3 text-lg font-bold mono outline-none transition-all"
                                style={{ color: 'var(--text)' }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls} style={labelStyle}>Kategori</label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className={inputCls}
                                style={{ color: 'var(--text)' }}
                            >
                                <option value="">Seçiniz</option>
                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls} style={labelStyle}>Tarih</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={inputCls + " mono"}
                                style={{ color: 'var(--text)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls} style={labelStyle}>Açıklama (Opsiyonel)</label>
                        <textarea
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full field px-4 py-3 text-sm outline-none transition-all resize-none"
                            style={{ color: 'var(--text)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50"
                        style={{
                            background: isIncome ? 'var(--success)' : 'var(--danger)',
                            boxShadow: `0 10px 30px -10px ${isIncome ? 'var(--success)' : 'var(--danger)'}`,
                        }}
                    >
                        {submitting
                            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <><Check size={18} /> Kaydet</>}
                    </button>
                </form>
            </Card>
        </div>
    )
}
