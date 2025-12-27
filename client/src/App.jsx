import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const API_URL = 'http://localhost:5000/api'

// Pastel renk paleti
const COLORS = ['#A78BFA', '#F9A8D4', '#FCD34D', '#6EE7B7', '#93C5FD', '#FCA5A5', '#C4B5FD', '#5EEAD4']

// Ay isimleri
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Filtre state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category_id: ''
  })

  // Form hata state
  const [formErrors, setFormErrors] = useState({})

  // Verileri yükle
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catRes, expRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/expenses`)
      ])

      const catData = await catRes.json()
      const expData = await expRes.json()

      if (catData.success) setCategories(catData.data)
      if (expData.success) setExpenses(expData.data)
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
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

    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      const data = await response.json()

      if (data.success) {
        setFormData({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category_id: ''
        })
        setFormErrors({})
        fetchData()
      } else {
        alert(data.error || 'Bir hata oluştu')
      }
    } catch (error) {
      console.error('Harcama ekleme hatası:', error)
      alert('Sunucuya bağlanılamadı')
    } finally {
      setSubmitting(false)
    }
  }

  // Harcama sil
  const handleDelete = async (id) => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      setDeleting(id)
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchData()
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

  // Filtrelenmiş veriler
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear
  })

  // Aylık toplam gider
  const monthlyTotal = filteredExpenses
    .filter(exp => exp.category_type === 'Gider')
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Aylık toplam gelir
  const monthlyIncome = filteredExpenses
    .filter(exp => exp.category_type === 'Gelir')
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Kategori bazlı harcama verileri
  const categoryData = categories
    .filter(cat => cat.type === 'Gider')
    .map(cat => {
      const total = filteredExpenses
        .filter(exp => exp.category_id === cat.id)
        .reduce((sum, exp) => sum + exp.amount, 0)
      return { name: cat.name, value: total }
    })
    .filter(item => item.value > 0)

  // Yıl listesi
  const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))]
  if (!years.includes(new Date().getFullYear())) {
    years.push(new Date().getFullYear())
  }
  years.sort((a, b) => b - a)

  // Tarih formatla
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Para formatla
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount)
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-2xl border-b ${darkMode ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className={`text-2xl font-bold bg-gradient-to-r ${darkMode ? 'from-violet-400 to-pink-400' : 'from-violet-600 to-pink-600'} bg-clip-text text-transparent`}>
            💰 Kişisel Gider Takibi
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400 shadow-slate-900' : 'bg-white hover:bg-slate-50 text-slate-700 shadow-slate-200'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Ay Seçici */}
            <section className={`rounded-3xl p-6 ${darkMode ? 'bg-slate-900/50' : 'bg-white'} shadow-2xl ${darkMode ? 'shadow-slate-900/50' : 'shadow-slate-200'} backdrop-blur-xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>📅 Dönem:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all focus:ring-4 focus:ring-violet-500/20 ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-violet-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-500'
                      }`}
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className={`px-4 py-2.5 rounded-xl border-2 transition-all focus:ring-4 focus:ring-violet-500/20 ${darkMode
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-violet-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-500'
                      }`}
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSelectedMonth(new Date().getMonth())
                    setSelectedYear(new Date().getFullYear())
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  Bu Ay
                </button>
              </div>
            </section>

            {/* Özet Kartları */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bu Ayın Gideri */}
              <div className="rounded-3xl p-6 bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/25 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-sm font-medium">{MONTHS[selectedMonth]} Gideri</p>
                    <p className="text-4xl font-bold text-white mt-2">{formatMoney(monthlyTotal)}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-4xl">💸</span>
                  </div>
                </div>
              </div>

              {/* Bu Ayın Geliri */}
              <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/25 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-200 text-sm font-medium">{MONTHS[selectedMonth]} Geliri</p>
                    <p className="text-4xl font-bold text-white mt-2">{formatMoney(monthlyIncome)}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-4xl">💵</span>
                  </div>
                </div>
              </div>

              {/* Net Bakiye */}
              <div className={`rounded-3xl p-6 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 ${monthlyIncome - monthlyTotal >= 0
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/25'
                  : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${monthlyIncome - monthlyTotal >= 0 ? 'text-blue-200' : 'text-rose-200'}`}>Net Bakiye</p>
                    <p className="text-4xl font-bold text-white mt-2">{formatMoney(monthlyIncome - monthlyTotal)}</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-4xl">{monthlyIncome - monthlyTotal >= 0 ? '📈' : '📉'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Form ve Grafik */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Harcama Ekleme Formu */}
              <div className={`rounded-3xl p-8 ${darkMode ? 'bg-slate-900/50' : 'bg-white'} shadow-2xl ${darkMode ? 'shadow-slate-900/50' : 'shadow-slate-200'} backdrop-blur-xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  ➕ Yeni İşlem Ekle
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Tutar */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
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
                      className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all focus:ring-4 focus:ring-violet-500/20 ${formErrors.amount
                          ? 'border-rose-500 focus:border-rose-500'
                          : darkMode
                            ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'
                        }`}
                    />
                    {formErrors.amount && (
                      <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.amount}
                      </p>
                    )}
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Kategori *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => {
                        setFormData({ ...formData, category_id: e.target.value })
                        if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: null })
                      }}
                      className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all focus:ring-4 focus:ring-violet-500/20 ${formErrors.category_id
                          ? 'border-rose-500 focus:border-rose-500'
                          : darkMode
                            ? 'bg-slate-800/50 border-slate-700 text-white focus:border-violet-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-500'
                        }`}
                    >
                      <option value="">Kategori seçin...</option>
                      <optgroup label="💸 Giderler">
                        {categories.filter(c => c.type === 'Gider').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="💵 Gelirler">
                        {categories.filter(c => c.type === 'Gelir').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </optgroup>
                    </select>
                    {formErrors.category_id && (
                      <p className="mt-2 text-sm text-rose-500 flex items-center gap-1">
                        <span>⚠️</span> {formErrors.category_id}
                      </p>
                    )}
                  </div>

                  {/* Tarih */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Tarih *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all focus:ring-4 focus:ring-violet-500/20 ${darkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:border-violet-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-500'
                        }`}
                    />
                  </div>

                  {/* Açıklama */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Açıklama girin..."
                      className={`w-full px-4 py-3.5 rounded-2xl border-2 transition-all focus:ring-4 focus:ring-violet-500/20 ${darkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'
                        }`}
                    />
                  </div>

                  {/* Gönder Butonu */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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
              <div className={`rounded-3xl p-8 ${darkMode ? 'bg-slate-900/50' : 'bg-white'} shadow-2xl ${darkMode ? 'shadow-slate-900/50' : 'shadow-slate-200'} backdrop-blur-xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  📊 Kategori Dağılımı
                </h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: darkMode ? '#94a3b8' : '#64748b', strokeWidth: 1 }}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke={darkMode ? '#0f172a' : '#ffffff'}
                            strokeWidth={3}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatMoney(value)}
                        contentStyle={{
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          border: 'none',
                          borderRadius: '16px',
                          color: darkMode ? '#ffffff' : '#000000',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          color: darkMode ? '#94a3b8' : '#64748b'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-6xl mb-4">📭</p>
                      <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Bu dönemde harcama verisi yok
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Harcama Listesi */}
            <section className={`rounded-3xl overflow-hidden ${darkMode ? 'bg-slate-900/50' : 'bg-white'} shadow-2xl ${darkMode ? 'shadow-slate-900/50' : 'shadow-slate-200'} backdrop-blur-xl border ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className={`p-6 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    📋 {MONTHS[selectedMonth]} {selectedYear} İşlemleri
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                    {filteredExpenses.length} kayıt
                  </span>
                </div>
              </div>

              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tarih</th>
                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Kategori</th>
                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Açıklama</th>
                        <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Tutar</th>
                        <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium ${expense.category_type === 'Gelir'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                              }`}>
                              {expense.category_type === 'Gelir' ? '💵' : '💸'} {expense.category_name}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm max-w-xs truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {expense.description || '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${expense.category_type === 'Gelir' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                            {expense.category_type === 'Gelir' ? '+' : '-'}{formatMoney(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDelete(expense.id)}
                              disabled={deleting === expense.id}
                              className={`p-2 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${darkMode
                                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                  : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                                } disabled:opacity-50`}
                              title="Sil"
                            >
                              {deleting === expense.id ? (
                                <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <span className="text-lg">🗑️</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center">
                  <p className="text-6xl mb-4">📭</p>
                  <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Bu dönemde işlem kaydı yok. Yukarıdaki formdan ilk işleminizi ekleyin!
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t mt-12 py-6 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}>
        <p className={`text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          💰 Kişisel Gider Takibi © 2025
        </p>
      </footer>
    </div>
  )
}

export default App
