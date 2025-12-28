import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

export default function Transactions() {
    const { authFetch } = useAuth()
    const { darkMode } = useOutletContext()

    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(null)

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, expenseId: null, expenseName: '' })
    const [dontAskAgain, setDontAskAgain] = useState(() => localStorage.getItem('skipDeleteConfirm') === 'true')

    const today = new Date().toISOString().split('T')[0]
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [filters, setFilters] = useState({
        startDate: firstDayOfMonth,
        endDate: today,
        type: 'all'
    })

    useEffect(() => {
        fetchExpenses()
    }, [filters])

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
            }
        } catch (error) {
            console.error('Harcama yükleme hatası:', error)
        } finally {
            setLoading(false)
        }
    }

    // Silme işlemini başlat
    const initiateDelete = (expense) => {
        if (dontAskAgain) {
            performDelete(expense.id)
        } else {
            setDeleteModal({
                isOpen: true,
                expenseId: expense.id,
                expenseName: `${expense.category_name} - ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(expense.amount)}`
            })
        }
    }

    // Silme işlemini gerçekleştir
    const performDelete = async (id) => {
        try {
            setDeleting(id)
            setDeleteModal({ isOpen: false, expenseId: null, expenseName: '' })

            const response = await authFetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
            const data = await response.json()

            if (data.success) {
                setExpenses(expenses.filter(e => e.id !== id))
            }
        } catch (error) {
            console.error('Silme hatası:', error)
        } finally {
            setDeleting(null)
        }
    }

    // Modal onaylama
    const confirmDelete = () => {
        if (dontAskAgain) {
            localStorage.setItem('skipDeleteConfirm', 'true')
        }
        performDelete(deleteModal.expenseId)
    }

    const exportToCSV = () => {
        if (expenses.length === 0) return

        // Excel uyumlu format: noktalı virgül ayraç, UTF-8 BOM
        const headers = ['Tarih', 'Kategori', 'Tür', 'Açıklama', 'Tutar']
        const rows = expenses.map(e => [
            e.date,
            e.category_name,
            e.category_type,
            e.description || '',
            e.amount.toString().replace('.', ',') // Ondalık ayırıcı virgül
        ])

        // Noktalı virgül ile ayır
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(';'))
            .join('\n')

        // UTF-8 BOM ile dosya oluştur
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `finans-raporu-${filters.startDate}-${filters.endDate}.csv`
        link.click()
    }

    const formatMoney = (a) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(a)
    const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR')

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteModal({ isOpen: false, expenseId: null, expenseName: '' })}
                    />
                    <div className={`relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center text-4xl">
                                🗑️
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                İşlemi Sil
                            </h3>
                            <p className={`mb-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Bu işlemi silmek istediğinize emin misiniz?
                            </p>
                            <p className={`mb-4 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {deleteModal.expenseName}
                            </p>

                            <label className={`flex items-center justify-center gap-2 mb-6 cursor-pointer text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                <input
                                    type="checkbox"
                                    checked={dontAskAgain}
                                    onChange={(e) => setDontAskAgain(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                                Bir daha sorma
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, expenseId: null, expenseName: '' })}
                                    className={`flex-1 py-3 rounded-xl font-medium transition-colors ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>📋 Hareketler</h1>
                <button onClick={exportToCSV} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
                    📥 CSV İndir
                </button>
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[140px]">
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Başlangıç</label>
                        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-violet-500 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bitiş</label>
                        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-violet-500 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className={`block text-xs mb-1.5 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tür</label>
                        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-violet-500 outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                            <option value="all">Tümü</option>
                            <option value="Gelir">Gelirler</option>
                            <option value="Gider">Giderler</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                            <tr>
                                <th className={`px-6 py-4 text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TARİH</th>
                                <th className={`px-6 py-4 text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>KATEGORİ</th>
                                <th className={`px-6 py-4 text-xs font-semibold hidden sm:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AÇIKLAMA</th>
                                <th className={`px-6 py-4 text-xs font-semibold text-right ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>TUTAR</th>
                                <th className={`px-6 py-4 text-xs font-semibold text-center ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                            ) : (
                                expenses.map(e => (
                                    <tr key={e.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                                        <td className={`px-6 py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{formatDate(e.date)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${e.category_type === 'Gelir'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-rose-500/10 text-rose-500'
                                                }`}>
                                                {e.category_type === 'Gelir' ? '↗' : '↘'} {e.category_name}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-sm hidden sm:table-cell ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{e.description || '-'}</td>
                                        <td className={`px-6 py-4 text-sm font-bold text-right ${e.category_type === 'Gelir' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {e.category_type === 'Gelir' ? '+' : '-'}{formatMoney(e.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => initiateDelete(e)}
                                                disabled={deleting === e.id}
                                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-rose-500/20 text-rose-500' : 'hover:bg-rose-100 text-rose-600'}`}
                                            >
                                                {deleting === e.id ? (
                                                    <span className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin inline-block" />
                                                ) : '🗑️'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
