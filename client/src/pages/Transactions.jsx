import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Download, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { API_URL } from '../config'

export default function Transactions() {
    const { authFetch } = useAuth()

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
        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `finans-raporu-${filters.startDate}-${filters.endDate}.csv`
        link.click()
    }

    const formatMoney = (a) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(a)
    const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR')

    const labelCls = "block text-[10px] uppercase tracking-[0.15em] mono mb-1.5"
    const labelStyle = { color: 'var(--text-3)' }
    const fieldCls = "w-full field px-3 py-2 text-sm outline-none transition-all"
    const thCls = "px-6 py-4 text-[11px] font-semibold uppercase tracking-wide mono"

    return (
        <div className="px-8 py-6 space-y-6 rise-stagger" style={{ maxWidth: 1480, margin: '0 auto' }}>
            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setDeleteModal({ isOpen: false, expenseId: null, expenseName: '' })}
                    />
                    <div className="card relative z-10 w-full max-w-md p-6 rise">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in oklab, var(--danger) 15%, transparent)', color: 'var(--danger)' }}>
                                <Trash2 size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 display" style={{ color: 'var(--text)' }}>
                                İşlemi Sil
                            </h3>
                            <p className="mb-2 text-sm" style={{ color: 'var(--text-2)' }}>
                                Bu işlemi silmek istediğinize emin misiniz?
                            </p>
                            <p className="mb-4 font-medium" style={{ color: 'var(--text)' }}>
                                {deleteModal.expenseName}
                            </p>

                            <label className="flex items-center justify-center gap-2 mb-6 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
                                <input
                                    type="checkbox"
                                    checked={dontAskAgain}
                                    onChange={(e) => setDontAskAgain(e.target.checked)}
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: 'var(--accent)' }}
                                />
                                Bir daha sorma
                            </label>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, expenseId: null, expenseName: '' })}
                                    className="flex-1 py-3 rounded-xl font-medium transition-colors"
                                    style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl font-medium text-white transition-colors"
                                    style={{ background: 'var(--danger)' }}
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold display" style={{ color: 'var(--text)' }}>Hareketler</h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>Tüm gelir ve giderleriniz</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                    style={{ background: 'var(--success)', boxShadow: '0 8px 22px -10px var(--success)' }}
                >
                    <Download size={16} /> CSV İndir
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[140px]">
                        <label className={labelCls} style={labelStyle}>Başlangıç</label>
                        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className={fieldCls + " mono"} style={{ color: 'var(--text)' }}
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className={labelCls} style={labelStyle}>Bitiş</label>
                        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className={fieldCls + " mono"} style={{ color: 'var(--text)' }}
                        />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className={labelCls} style={labelStyle}>Tür</label>
                        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className={fieldCls} style={{ color: 'var(--text)' }}
                        >
                            <option value="all">Tümü</option>
                            <option value="Gelir">Gelirler</option>
                            <option value="Gider">Giderler</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden" style={{ padding: 0 }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead style={{ background: 'var(--surface-2)' }}>
                            <tr>
                                <th className={thCls} style={{ color: 'var(--text-3)' }}>Tarih</th>
                                <th className={thCls} style={{ color: 'var(--text-3)' }}>Kategori</th>
                                <th className={thCls + " hidden sm:table-cell"} style={{ color: 'var(--text-3)' }}>Açıklama</th>
                                <th className={thCls + " text-right"} style={{ color: 'var(--text-3)' }}>Tutar</th>
                                <th className={thCls + " text-center"} style={{ color: 'var(--text-3)' }}>İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center" style={{ color: 'var(--text-3)' }}>Yükleniyor...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center" style={{ color: 'var(--text-3)' }}>Kayıt bulunamadı.</td></tr>
                            ) : (
                                expenses.map(e => {
                                    const isIncome = e.category_type === 'Gelir'
                                    const tone = isIncome ? 'var(--success)' : 'var(--danger)'
                                    return (
                                    <tr key={e.id} className="transition-colors row-hover" style={{ borderTop: '1px solid var(--border)' }}>
                                        <td className="px-6 py-4 text-sm mono" style={{ color: 'var(--text-2)' }}>{formatDate(e.date)}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                                                style={{ background: `color-mix(in oklab, ${tone} 12%, transparent)`, color: tone }}>
                                                {isIncome ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {e.category_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm hidden sm:table-cell" style={{ color: 'var(--text-3)' }}>{e.description || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-right mono" style={{ color: tone }}>
                                            {isIncome ? '+' : '-'}{formatMoney(e.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => initiateDelete(e)}
                                                disabled={deleting === e.id}
                                                className="p-2 rounded-lg transition-colors inline-flex items-center justify-center"
                                                style={{ color: 'var(--danger)' }}
                                                title="Sil"
                                            >
                                                {deleting === e.id ? (
                                                    <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block" style={{ borderColor: 'color-mix(in oklab, var(--danger) 30%, transparent)', borderTopColor: 'var(--danger)' }} />
                                                ) : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
