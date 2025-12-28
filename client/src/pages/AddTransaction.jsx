import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

export default function AddTransaction() {
    const { authFetch } = useAuth()
    const navigate = useNavigate()
    const { darkMode } = useOutletContext()

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

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>➕ Yeni Ekle</h1>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                {/* Type Toggle */}
                <div className={`flex rounded-xl p-1 mb-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, transactionType: 'Gelir', category_id: '' })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.transactionType === 'Gelir'
                                ? 'bg-emerald-500 text-white shadow-lg'
                                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        💵 Gelir
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, transactionType: 'Gider', category_id: '' })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.transactionType === 'Gider'
                                ? 'bg-rose-500 text-white shadow-lg'
                                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        💸 Gider
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tutar</label>
                        <div className="relative">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>₺</span>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className={`w-full pl-8 pr-4 py-3 rounded-xl text-lg font-bold outline-none border focus:ring-2 focus:ring-violet-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kategori</label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-violet-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            >
                                <option value="">Seçiniz</option>
                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tarih</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-violet-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Açıklama (Opsiyonel)</label>
                        <textarea
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-violet-500 transition-all resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${formData.transactionType === 'Gelir'
                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                            }`}
                    >
                        {submitting ? '...' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    )
}
