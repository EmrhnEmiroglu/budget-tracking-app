import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const API_URL = 'http://localhost:5000/api'

// Renk paleti
const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6']

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category_id: ''
  })

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

  // Form gönder
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.amount || !formData.category_id || !formData.date) {
      alert('Lütfen tüm zorunlu alanları doldurun')
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
        // Formu temizle ve verileri yenile
        setFormData({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          category_id: ''
        })
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

  // Bu ayın toplam gideri
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyTotal = expenses
    .filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth &&
        expDate.getFullYear() === currentYear &&
        exp.category_type === 'Gider'
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Toplam gelir
  const monthlyIncome = expenses
    .filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth &&
        expDate.getFullYear() === currentYear &&
        exp.category_type === 'Gelir'
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Kategori bazlı harcama verileri (pasta grafik için)
  const categoryData = categories
    .filter(cat => cat.type === 'Gider')
    .map(cat => {
      const total = expenses
        .filter(exp => exp.category_id === cat.id)
        .reduce((sum, exp) => sum + exp.amount, 0)
      return { name: cat.name, value: total }
    })
    .filter(item => item.value > 0)

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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            💰 Kişisel Gider Takibi
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Özet Kartları */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bu Ayın Gideri */}
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-700'} shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Bu Ayın Gideri</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatMoney(monthlyTotal)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">💸</span>
                  </div>
                </div>
              </div>

              {/* Bu Ayın Geliri */}
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'} shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-200 text-sm font-medium">Bu Ayın Geliri</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatMoney(monthlyIncome)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">💵</span>
                  </div>
                </div>
              </div>

              {/* Net Bakiye */}
              <div className={`rounded-2xl p-6 ${monthlyIncome - monthlyTotal >= 0
                ? (darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-700')
                : (darkMode ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-red-500 to-red-700')
                } shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${monthlyIncome - monthlyTotal >= 0 ? 'text-blue-200' : 'text-red-200'}`}>Net Bakiye</p>
                    <p className="text-3xl font-bold text-white mt-2">{formatMoney(monthlyIncome - monthlyTotal)}</p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">{monthlyIncome - monthlyTotal >= 0 ? '📈' : '📉'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Form ve Grafik */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Harcama Ekleme Formu */}
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ➕ Yeni İşlem Ekle
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Tutar */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tutar *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      required
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Kategori *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      required
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
                  </div>

                  {/* Tarih */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tarih *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      required
                    />
                  </div>

                  {/* Açıklama */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Açıklama girin..."
                      className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:ring-purple-500 focus:border-transparent ${darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                    />
                  </div>

                  {/* Gönder Butonu */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
                <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Kategori Dağılımı
                </h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatMoney(value)}
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          color: darkMode ? '#FFFFFF' : '#000000'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      📭 Henüz harcama verisi yok
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Harcama Listesi */}
            <section className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}>
              <div className="p-6 border-b border-gray-700">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📋 Son İşlemler
                </h2>
              </div>

              {expenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tarih</th>
                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Kategori</th>
                        <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Açıklama</th>
                        <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {expenses.slice(0, 10).map((expense) => (
                        <tr key={expense.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${expense.category_type === 'Gelir'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-purple-500/20 text-purple-400'
                              }`}>
                              {expense.category_type === 'Gelir' ? '💵' : '💸'} {expense.category_name}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {expense.description || '-'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${expense.category_type === 'Gelir' ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                            {expense.category_type === 'Gelir' ? '+' : '-'}{formatMoney(expense.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    📭 Henüz işlem kaydı yok. Yukarıdaki formdan ilk işleminizi ekleyin!
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`border-t mt-12 py-6 ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          💰 Kişisel Gider Takibi © 2025
        </p>
      </footer>
    </div>
  )
}

export default App
