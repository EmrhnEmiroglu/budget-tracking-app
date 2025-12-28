import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

export default function Settings() {
    const { authFetch } = useAuth()
    const { darkMode } = useOutletContext()

    const [categories, setCategories] = useState([])
    const [budgets, setBudgets] = useState({}) // {categoryId: budgetLimit}
    const [savingBudget, setSavingBudget] = useState(null)
    const [newCategory, setNewCategory] = useState({ name: '', type: 'Gider' })
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await authFetch(`${API_URL}/categories`)
            const data = await response.json()
            if (data.success) {
                setCategories(data.data)
                // Mevcut bütçe limitlerini state'e yükle
                const budgetMap = {}
                data.data.forEach(c => {
                    budgetMap[c.id] = c.budget_limit || 0
                })
                setBudgets(budgetMap)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategory.name) return

        try {
            setLoading(true)
            const response = await authFetch(`${API_URL}/categories`, {
                method: 'POST',
                body: JSON.stringify(newCategory)
            })
            const data = await response.json()

            if (data.success) {
                setNewCategory({ name: '', type: 'Gider' })
                fetchCategories()
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const saveBudget = async (categoryId) => {
        try {
            setSavingBudget(categoryId)
            const response = await authFetch(`${API_URL}/categories/${categoryId}/budget`, {
                method: 'PUT',
                body: JSON.stringify({ budget_limit: budgets[categoryId] || 0 })
            })
            const data = await response.json()
            if (!data.success) {
                alert(data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setSavingBudget(null)
        }
    }

    // CSV Export
    const exportAllData = async () => {
        try {
            setExporting(true)
            const response = await authFetch(`${API_URL}/expenses`)
            const data = await response.json()

            if (!data.success || data.data.length === 0) {
                alert('Dışa aktarılacak veri bulunamadı')
                return
            }

            const expenses = data.data
            const headers = ['Tarih', 'Kategori', 'Tür', 'Açıklama', 'Tutar']
            const rows = expenses.map(e => [
                e.date,
                e.category_name,
                e.category_type,
                e.description || '',
                e.amount.toString().replace('.', ',')
            ])

            const csvContent = [headers, ...rows]
                .map(row => row.map(cell => `"${cell}"`).join(';'))
                .join('\n')

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `tum-islemler-${new Date().toISOString().split('T')[0]}.csv`
            link.click()
        } catch (error) {
            console.error('Export hatası:', error)
            alert('Dışa aktarma sırasında bir hata oluştu')
        } finally {
            setExporting(false)
        }
    }

    const formatMoney = (a) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(a)

    const expenseCategories = categories.filter(c => c.type === 'Gider')
    const incomeCategories = categories.filter(c => c.type === 'Gelir')

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>⚙️ Ayarlar</h1>

            {/* Data Export Section */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>📥 Verileri Dışa Aktar</h2>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Tüm işlem geçmişinizi CSV formatında indirin.
                        </p>
                    </div>
                    <button
                        onClick={exportAllData}
                        disabled={exporting}
                        className="px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        {exporting ? '...' : '📥 CSV İndir'}
                    </button>
                </div>
            </div>

            {/* Budget Limits Section */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>💰 Aylık Bütçe Limitleri</h2>
                <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Her gider kategorisi için aylık harcama limiti belirleyin.
                </p>

                <div className="space-y-3">
                    {expenseCategories.map(category => (
                        <div key={category.id} className={`flex items-center gap-4 p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                            <span className={`flex-1 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {category.name}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>₺</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={budgets[category.id] || ''}
                                    onChange={(e) => setBudgets({ ...budgets, [category.id]: parseFloat(e.target.value) || 0 })}
                                    placeholder="0"
                                    className={`w-28 px-3 py-2 rounded-lg text-sm text-right outline-none border focus:ring-2 focus:ring-violet-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                />
                                <button
                                    onClick={() => saveBudget(category.id)}
                                    disabled={savingBudget === category.id}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${savingBudget === category.id
                                            ? 'bg-slate-600 text-slate-300'
                                            : 'bg-violet-600 text-white hover:bg-violet-700'
                                        }`}
                                >
                                    {savingBudget === category.id ? '...' : 'Kaydet'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Category Section */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>➕ Yeni Kategori Ekle</h2>
                <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kategori Adı</label>
                        <input
                            type="text"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-violet-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                            placeholder="Örn: Market, Kira..."
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tür</label>
                        <select
                            value={newCategory.type}
                            onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl text-sm outline-none border focus:ring-2 focus:ring-violet-500 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                            <option value="Gider">Gider</option>
                            <option value="Gelir">Gelir</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/20`}
                    >
                        {loading ? '...' : 'Ekle'}
                    </button>
                </form>
            </div>

            {/* List Categories */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>📂 Mevcut Kategoriler</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map(c => (
                        <div key={c.id} className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{c.name}</span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${c.type === 'Gelir' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {c.type}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
