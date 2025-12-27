import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const API_URL = 'http://localhost:5000/api'

// Pastel renk paleti
const COLORS = ['#C4B5FD', '#FBCFE8', '#FDE68A', '#A7F3D0', '#BAE6FD', '#FECACA', '#DDD6FE', '#99F6E4']

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, expenseId: null })
  const [dontAskAgain, setDontAskAgain] = useState(() => {
    return localStorage.getItem('skipDeleteConfirm') === 'true'
  })

  // Filtre state - Tarih aralığı
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [filters, setFilters] = useState({
    startDate: firstDayOfMonth,
    endDate: today,
    type: 'all' // 'all', 'Gelir', 'Gider'
  })

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: today,
    category_id: '',
    transactionType: 'Gider' // Toggle: 'Gelir' veya 'Gider'
  })

  const [formErrors, setFormErrors] = useState({})

  // Kategorileri yükle
  useEffect(() => {
    fetchCategories()
  }, [])

  // Filtre değiştiğinde verileri yükle
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

      const response = await fetch(`${API_URL}/expenses?${params}`)
      const data = await response.json()

      if (data.success) setExpenses(data.data)
    } catch (error) {
      console.error('Harcama yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  // Form validasyonu
  const validateForm = () => {
    const errors = {}

    if (!formData.amount || formData.amount.trim() === '') {
      errors.amount = 'Tutar zorunludur'
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = 'Tutar 0\'dan büyük olmalıdır'
    }

    if (!formData.category_id) {
      errors.category_id = 'Kategori seçimi zorunludur'
    }

    if (!formData.date) {
      errors.date = 'Tarih zorunludur'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form gönder
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSubmitting(true)
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          category_id: parseInt(formData.category_id)
        })
      })

      const data = await response.json()

      if (data.success) {
        setFormData({
          amount: '',
          description: '',
          date: today,
          category_id: '',
          transactionType: 'Gider'
        })
        setFormErrors({})
        fetchExpenses()
      } else {
        alert(data.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Ekleme hatası:', error)
      alert('Sunucuya bağlanılamadı')
    } finally {
      setSubmitting(false)
    }
  }

  // Silme işlemi başlat
  const initiateDelete = (id) => {
    if (dontAskAgain) {
      performDelete(id)
    } else {
      setDeleteModal({ isOpen: true, expenseId: id })
    }
  }

  // Silme işlemini gerçekleştir
  const performDelete = async (id) => {
    try {
      setDeleting(id)
      setDeleteModal({ isOpen: false, expenseId: null })

      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchExpenses()
      } else {
        alert(data.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('Sunucuya bağlanılamadı')
    } finally {
      setDeleting(null)
    }
  }

  // Modal onayı
  const confirmDelete = () => {
    if (dontAskAgain) {
      localStorage.setItem('skipDeleteConfirm', 'true')
    }
    performDelete(deleteModal.expenseId)
  }

  // Filtrelenmiş kategoriler (seçilen türe göre)
  const filteredCategories = categories.filter(c => c.type === formData.transactionType)

  // Toplam hesaplamaları
  const totalIncome = expenses
    .filter(exp => exp.category_type === 'Gelir')
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalExpense = expenses
    .filter(exp => exp.category_type === 'Gider')
    .reduce((sum, exp) => sum + exp.amount, 0)

  const netBalance = totalIncome - totalExpense

  // Pasta grafik verisi
  const pieChartData = categories
    .filter(cat => cat.type === 'Gider')
    .map(cat => {
      const total = expenses
        .filter(exp => exp.category_id === cat.id)
        .reduce((sum, exp) => sum + exp.amount, 0)
      return { name: cat.name, value: total }
    })
    .filter(item => item.value > 0)

  // Bar chart verisi
  const barChartData = [
    { name: 'Gelir', value: totalIncome, fill: '#6EE7B7' },
    { name: 'Gider', value: totalExpense, fill: '#FCA5A5' }
  ]

  // Para formatla
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  // Tarih formatla
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Hızlı tarih filtreleri
  const setQuickFilter = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    })
  }

  const setThisMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setFilters({
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    })
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteModal({ isOpen: false, expenseId: null })}
          />

          {/* Modal */}
          <div className={`relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center">
                <span className="text-4xl">🗑️</span>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                İşlemi Sil
              </h3>
              <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Bu işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>

              {/* Checkbox */}
              <label className={`flex items-center justify-center gap-2 mb-6 cursor-pointer ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <input
                  type="checkbox"
                  checked={dontAskAgain}
                  onChange={(e) => setDontAskAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm">Bir daha sorma</span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, expenseId: null })}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                  İptal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-medium bg-rose-500 hover:bg-rose-600 text-white transition-all"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-2xl border-b ${darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className={`text-2xl font-bold bg-gradient-to-r ${darkMode ? 'from-violet-400 to-pink-400' : 'from-violet-600 to-pink-600'} bg-clip-text text-transparent`}>
            💰 Finans Yönetimi
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading && expenses.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Filtre Paneli */}
            <section className={`rounded-2xl p-6 ${darkMode ? 'bg-slate-900/70' : 'bg-white'} shadow-lg border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-end gap-4">
                {/* Başlangıç Tarihi */}
                <div className="flex-1 min-w-[150px]">
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Başlangıç
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                  />
                </div>

                {/* Bitiş Tarihi */}
                <div className="flex-1 min-w-[150px]">
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Bitiş
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                  />
                </div>

                {/* Tür Filtresi */}
                <div className="flex-1 min-w-[150px]">
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Tür
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                  >
                    <option value="all">Hepsini Göster</option>
                    <option value="Gelir">Sadece Gelirler</option>
                    <option value="Gider">Sadece Giderler</option>
                  </select>
                </div>

                {/* Hızlı Filtreler */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuickFilter(7)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                  >
                    7 Gün
                  </button>
                  <button
                    onClick={() => setQuickFilter(30)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                  >
                    30 Gün
                  </button>
                  <button
                    onClick={setThisMonth}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${darkMode ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-violet-500 hover:bg-violet-600 text-white'
                      }`}
                  >
                    Bu Ay
                  </button>
                </div>
              </div>
            </section>

            {/* Özet Kartları */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Toplam Gelir */}
              <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20 transform hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Toplam Gelir</p>
                    <p className="text-3xl font-bold text-white mt-1">{formatMoney(totalIncome)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">💵</span>
                  </div>
                </div>
              </div>

              {/* Toplam Gider */}
              <div className="rounded-2xl p-6 bg-gradient-to-br from-rose-400 to-red-500 shadow-lg shadow-rose-500/20 transform hover:scale-[1.02] transition-transform">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rose-100 text-sm font-medium">Toplam Gider</p>
                    <p className="text-3xl font-bold text-white mt-1">{formatMoney(totalExpense)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">💸</span>
                  </div>
                </div>
              </div>

              {/* Net Bakiye */}
              <div className={`rounded-2xl p-6 shadow-lg transform hover:scale-[1.02] transition-transform ${netBalance >= 0
                  ? 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-blue-500/20'
                  : 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/20'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${netBalance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Net Bakiye</p>
                    <p className="text-3xl font-bold text-white mt-1">{formatMoney(netBalance)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">{netBalance >= 0 ? '📈' : '📉'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Form ve Grafikler */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* İşlem Ekleme Formu */}
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-slate-900/70' : 'bg-white'} shadow-lg border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h2 className={`text-lg font-bold mb-5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  ➕ Yeni İşlem
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Gelir/Gider Toggle */}
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      İşlem Türü
                    </label>
                    <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, transactionType: 'Gelir', category_id: '' })
                        }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.transactionType === 'Gelir'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        💵 Gelir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, transactionType: 'Gider', category_id: '' })
                        }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.transactionType === 'Gider'
                            ? 'bg-rose-500 text-white shadow-lg'
                            : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        💸 Gider
                      </button>
                    </div>
                  </div>

                  {/* Tutar */}
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Tutar *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => {
                        setFormData({ ...formData, amount: e.target.value })
                        if (formErrors.amount) setFormErrors({ ...formErrors, amount: null })
                      }}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${formErrors.amount
                          ? 'border-rose-500 focus:border-rose-500'
                          : darkMode
                            ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                    />
                    {formErrors.amount && (
                      <p className="mt-1.5 text-xs text-rose-500">⚠️ {formErrors.amount}</p>
                    )}
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Kategori *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        setFormData({ ...formData, category_id: e.target.value })
                        if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: null })
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${formErrors.category_id
                          ? 'border-rose-500 focus:border-rose-500'
                          : darkMode
                            ? 'bg-slate-800 border-slate-700 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    >
                      <option value="">Kategori seçin...</option>
                      {filteredCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {formErrors.category_id && (
                      <p className="mt-1.5 text-xs text-rose-500">⚠️ {formErrors.category_id}</p>
                    )}
                  </div>

                  {/* Tarih */}
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Tarih *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${darkMode
                          ? 'bg-slate-800 border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                    />
                  </div>

                  {/* Açıklama */}
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Açıklama..."
                      className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:ring-2 focus:ring-violet-500/30 ${darkMode
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                        }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3.5 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${formData.transactionType === 'Gelir'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-violet-500 to-pink-500 shadow-violet-500/25'
                      } text-white`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Ekleniyor...
                      </span>
                    ) : (
                      '💾 Kaydet'
                    )}
                  </button>
                </form>
              </div>

              {/* Pasta Grafiği */}
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-slate-900/70' : 'bg-white'} shadow-lg border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  📊 Gider Dağılımı
                </h2>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke={darkMode ? '#0f172a' : '#ffffff'}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatMoney(value)}
                        contentStyle={{
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center">
                    <span className="text-5xl mb-2">📭</span>
                    <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Gider verisi yok</p>
                  </div>
                )}
              </div>

              {/* Bar Chart - Gelir/Gider Karşılaştırması */}
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-slate-900/70' : 'bg-white'} shadow-lg border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  📈 Gelir vs Gider
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                    <XAxis type="number" tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} width={50} />
                    <Tooltip
                      formatter={(value) => formatMoney(value)}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* İşlem Listesi */}
            <section className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-900/70' : 'bg-white'} shadow-lg border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className={`p-5 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-between`}>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  📋 İşlem Geçmişi
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  {expenses.length} kayıt
                </span>
              </div>

              {expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                      <tr>
                        <th className={`px-5 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tarih</th>
                        <th className={`px-5 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Kategori</th>
                        <th className={`px-5 py-3 text-left text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Açıklama</th>
                        <th className={`px-5 py-3 text-right text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tutar</th>
                        <th className={`px-5 py-3 text-center text-xs font-semibold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sil</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {expenses.map((expense) => (
                        <tr key={expense.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                          <td className={`px-5 py-4 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${expense.category_type === 'Gelir'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                              }`}>
                              {expense.category_type === 'Gelir' ? '💵' : '💸'} {expense.category_name}
                            </span>
                          </td>
                          <td className={`px-5 py-4 text-sm max-w-[200px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {expense.description || '-'}
                          </td>
                          <td className={`px-5 py-4 text-sm text-right font-bold ${expense.category_type === 'Gelir' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                            {expense.category_type === 'Gelir' ? '+' : '-'}{formatMoney(expense.amount)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => initiateDelete(expense.id)}
                              disabled={deleting === expense.id}
                              className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${darkMode
                                  ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                                  : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                } disabled:opacity-50`}
                            >
                              {deleting === expense.id ? (
                                <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                '🗑️'
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <span className="text-5xl block mb-3">📭</span>
                  <p className={`${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Bu tarih aralığında işlem bulunamadı.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className={`border-t mt-12 py-5 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className={`text-center text-xs ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          💰 Finans Yönetimi © 2025
        </p>
      </footer>
    </div>
  )
}

export default App
