import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'
const COLORS = ['#C4B5FD', '#FBCFE8', '#FDE68A', '#A7F3D0', '#BAE6FD', '#FECACA', '#DDD6FE', '#99F6E4']

function Dashboard() {
    const navigate = useNavigate()
    const { user, logout, authFetch } = useAuth()

    const [darkMode, setDarkMode] = useState(true)
    const [categories, setCategories] = useState([])
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [deleting, setDeleting] = useState(null)

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expenseId: null })
    const [dontAskAgain, setDontAskAgain] = useState(() => localStorage.getItem('skipDeleteConfirm') === 'true')

    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [filters, setFilters] = useState({
        startDate: firstDayOfMonth,
        endDate: today,
        type: 'all'
    })

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        date: today,
        category_id: '',
        transactionType: 'Gider'
    })

    const [formErrors, setFormErrors] = useState({})

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchExpenses()
    }, [filters])

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/categories`)
            const data = await response.json()
            if (data.success) setCategories(data.data)
        } catch (error) {
            console.error('Kategori yükleme hatası:', error)
        }
    }

    const fetchExpenses = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filters.startDate) params.append('startDate', filters.startDate)
            if (filters.endDate) params.append('endDate', filters.endDate)
            if (filters.type !== 'all') params.append('type', filters.type)

            const response = await authFetch(`${API_URL}/expenses?${params}`)
            const data = await response.json()

            if (data.success) {
                setExpenses(data.data)
            } else {
                console.error('Expenses fetch failed:', data.error)
                if (response.status === 401) {
                    logout()
                    navigate('/login')
                }
            }
        } catch (error) {
            console.error('Harcama yükleme hatası:', error)
            if (error.message === 'Oturum süresi dolmuş') {
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        const errors = {}
        if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Geçerli tutar giriniz'
        if (!formData.category_id) errors.category_id = 'Kategori seçiniz'
        if (!formData.date) errors.date = 'Tarih seçiniz'
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            setSubmitting(true)
            const response = await authFetch(`${API_URL}/expenses`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    date: formData.date,
                    category_id: parseInt(formData.category_id)
                })
            })

            const data = await response.json()

            if (data.success) {
                setFormData({ amount: '', description: '', date: today, category_id: '', transactionType: 'Gider' })
                setFormErrors({})
                fetchExpenses()
            } else {
                console.error('Expense add failed:', data.error)
                alert(data.error || 'Harcama eklenemedi')
            }
        } catch (error) {
            console.error('Ekleme hatası:', error)
            if (error.message === 'Oturum süresi dolmuş') {
                navigate('/login')
            }
        } finally {
            setSubmitting(false)
        }
    }

    const initiateDelete = (id) => {
        if (dontAskAgain) {
            performDelete(id)
        } else {
            setDeleteModal({ isOpen: true, expenseId: id })
        }
    }

    const performDelete = async (id) => {
        try {
            setDeleting(id)
            setDeleteModal({ isOpen: false, expenseId: null })

            const response = await authFetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
            const data = await response.json()

            if (data.success) {
                fetchExpenses()
            } else {
                console.error('Delete failed:', data.error)
                alert(data.error || 'Silme işlemi başarısız')
            }
        } catch (error) {
            console.error('Silme hatası:', error)
            if (error.message === 'Oturum süresi dolmuş') {
                navigate('/login')
            }
        } finally {
            setDeleting(null)
        }
    }

    const confirmDelete = () => {
        if (dontAskAgain) localStorage.setItem('skipDeleteConfirm', 'true')
        performDelete(deleteModal.expenseId)
    }

    // CSV Export
    const exportToCSV = () => {
        if (expenses.length === 0) return

        const headers = ['Tarih', 'Kategori', 'Tür', 'Açıklama', 'Tutar']
        const rows = expenses.map(e => [
            e.date,
            e.category_name,
            e.category_type,
            e.description || '',
            e.amount
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `finans-raporu-${filters.startDate}-${filters.endDate}.csv`
        link.click()
    }

    const filteredCategories = categories.filter(c => c.type === formData.transactionType)
    const totalIncome = expenses.filter(e => e.category_type === 'Gelir').reduce((s, e) => s + e.amount, 0)
    const totalExpense = expenses.filter(e => e.category_type === 'Gider').reduce((s, e) => s + e.amount, 0)
    const netBalance = totalIncome - totalExpense

    const pieChartData = categories.filter(c => c.type === 'Gider')
        .map(c => ({ name: c.name, value: expenses.filter(e => e.category_id === c.id).reduce((s, e) => s + e.amount, 0) }))
        .filter(i => i.value > 0)

    const barChartData = [
        { name: 'Gelir', value: totalIncome, fill: '#6EE7B7' },
        { name: 'Gider', value: totalExpense, fill: '#FCA5A5' }
    ]

    const formatMoney = (a) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(a)
    const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR')

    const setQuickFilter = (days) => {
        const end = new Date(), start = new Date()
        start.setDate(start.getDate() - days)
        setFilters({ ...filters, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] })
    }

    const setThisMonth = () => {
        const now = new Date()
        setFilters({
            ...filters,
            startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
            endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        })
    }

    return (
        <div className={`min-h-screen transition-colors ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            {/* Delete Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, expenseId: null })} />
                    <div className={`relative z-10 w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center text-3xl">🗑️</div>
                            <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>İşlemi Sil</h3>
                            <p className={`mb-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bu işlemi silmek istediğinize emin misiniz?</p>
                            <label className={`flex items-center justify-center gap-2 mb-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                <input type="checkbox" checked={dontAskAgain} onChange={(e) => setDontAskAgain(e.target.checked)} className="rounded" />
                                Bir daha sorma
                            </label>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal({ isOpen: false, expenseId: null })} className={`flex-1 py-2.5 rounded-xl ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>İptal</button>
                                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white">Sil</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">💰 Finans</h1>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm hidden sm:block ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>👋 {user?.username}</span>
                        <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-700'}`}>
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                        <button onClick={() => { logout(); navigate('/login'); }} className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-sm font-medium">Çıkış</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Filters */}
                <section className={`rounded-2xl p-4 ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} border`}>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[120px]">
                            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Başlangıç</label>
                            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className={`w-full px-3 py-2 rounded-xl text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Bitiş</label>
                            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className={`w-full px-3 py-2 rounded-xl text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className={`block text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tür</label>
                            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`w-full px-3 py-2 rounded-xl text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                <option value="all">Hepsi</option>
                                <option value="Gelir">Gelirler</option>
                                <option value="Gider">Giderler</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setQuickFilter(7)} className={`px-3 py-2 rounded-xl text-xs ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>7G</button>
                            <button onClick={() => setQuickFilter(30)} className={`px-3 py-2 rounded-xl text-xs ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>30G</button>
                            <button onClick={setThisMonth} className="px-3 py-2 rounded-xl text-xs bg-violet-600 text-white">Bu Ay</button>
                            <button onClick={exportToCSV} className="px-3 py-2 rounded-xl text-xs bg-emerald-600 text-white">📥 CSV</button>
                        </div>
                    </div>
                </section>

                {/* Summary Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
                        <p className="text-emerald-100 text-xs">Toplam Gelir</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatMoney(totalIncome)}</p>
                    </div>
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-rose-400 to-red-500 shadow-lg">
                        <p className="text-rose-100 text-xs">Toplam Gider</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatMoney(totalExpense)}</p>
                    </div>
                    <div className={`rounded-2xl p-5 shadow-lg ${netBalance >= 0 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                        <p className={`text-xs ${netBalance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Net Bakiye</p>
                        <p className="text-2xl font-bold text-white mt-1">{formatMoney(netBalance)}</p>
                    </div>
                </section>

                {/* Form & Charts */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Form */}
                    <div className={`rounded-2xl p-5 ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} border`}>
                        <h2 className={`text-base font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>➕ Yeni İşlem</h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <button type="button" onClick={() => setFormData({ ...formData, transactionType: 'Gelir', category_id: '' })} className={`flex-1 py-2 rounded-lg text-sm ${formData.transactionType === 'Gelir' ? 'bg-emerald-500 text-white' : darkMode ? 'text-slate-400' : 'text-slate-600'}`}>💵 Gelir</button>
                                <button type="button" onClick={() => setFormData({ ...formData, transactionType: 'Gider', category_id: '' })} className={`flex-1 py-2 rounded-lg text-sm ${formData.transactionType === 'Gider' ? 'bg-rose-500 text-white' : darkMode ? 'text-slate-400' : 'text-slate-600'}`}>💸 Gider</button>
                            </div>
                            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="Tutar" className={`w-full px-3 py-2.5 rounded-xl text-sm border ${formErrors.amount ? 'border-rose-500' : darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${formErrors.category_id ? 'border-rose-500' : darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                <option value="">Kategori seçin</option>
                                {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={`w-full px-3 py-2.5 rounded-xl text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Açıklama" className={`w-full px-3 py-2.5 rounded-xl text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                            <button type="submit" disabled={submitting} className={`w-full py-3 rounded-xl font-semibold text-white ${formData.transactionType === 'Gelir' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-violet-500 to-pink-500'}`}>
                                {submitting ? '...' : '💾 Kaydet'}
                            </button>
                        </form>
                    </div>

                    {/* Pie Chart */}
                    <div className={`rounded-2xl p-5 ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} border`}>
                        <h2 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>📊 Gider Dağılımı</h2>
                        {pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {pieChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={2} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '10px' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[200px] flex items-center justify-center text-slate-500">Veri yok</div>}
                    </div>

                    {/* Bar Chart */}
                    <div className={`rounded-2xl p-5 ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} border`}>
                        <h2 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>📈 Gelir vs Gider</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={barChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                <XAxis type="number" tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                                <YAxis type="category" dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} width={45} />
                                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: 'none', borderRadius: '10px' }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Transactions Table */}
                <section className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'} border`}>
                    <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>📋 İşlemler</h2>
                        <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>{expenses.length}</span>
                    </div>
                    {expenses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                                    <tr>
                                        <th className={`px-4 py-3 text-left text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tarih</th>
                                        <th className={`px-4 py-3 text-left text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kategori</th>
                                        <th className={`px-4 py-3 text-left text-xs hidden sm:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Açıklama</th>
                                        <th className={`px-4 py-3 text-right text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tutar</th>
                                        <th className={`px-4 py-3 text-center text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sil</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                    {expenses.map(e => (
                                        <tr key={e.id} className={darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                                            <td className={`px-4 py-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{formatDate(e.date)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${e.category_type === 'Gelir' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/15 text-violet-400'}`}>
                                                    {e.category_type === 'Gelir' ? '💵' : '💸'} {e.category_name}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-sm hidden sm:table-cell truncate max-w-[150px] ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{e.description || '-'}</td>
                                            <td className={`px-4 py-3 text-sm text-right font-bold ${e.category_type === 'Gelir' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {e.category_type === 'Gelir' ? '+' : '-'}{formatMoney(e.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => initiateDelete(e.id)} disabled={deleting === e.id} className={`p-1.5 rounded-lg ${darkMode ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
                                                    {deleting === e.id ? '...' : '🗑️'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div className="p-8 text-center text-slate-500">İşlem bulunamadı</div>}
                </section>
            </main>
        </div>
    )
}

export default Dashboard
