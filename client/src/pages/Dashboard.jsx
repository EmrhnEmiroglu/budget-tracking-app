import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const API_URL = 'http://localhost:5000/api'
const COLORS = ['#C4B5FD', '#FBCFE8', '#FDE68A', '#A7F3D0', '#BAE6FD', '#FECACA', '#DDD6FE', '#99F6E4']

export default function Dashboard() {
    const { authFetch } = useAuth()
    const { darkMode } = useOutletContext()

    const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 })
    const [expenses, setExpenses] = useState([])
    const [categories, setCategories] = useState([])
    const [budgetStatus, setBudgetStatus] = useState([])

    useEffect(() => {
        fetchSummary()
        fetchChartData()
        fetchCategories()
        fetchBudgetStatus()
    }, [])

    const fetchSummary = async () => {
        try {
            const response = await authFetch(`${API_URL}/summary`)
            const data = await response.json()
            if (data.success) setSummary(data.data)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await authFetch(`${API_URL}/categories`)
            const data = await response.json()
            if (data.success) setCategories(data.data)
        } catch (error) { console.error(error) }
    }

    const fetchChartData = async () => {
        try {
            const now = new Date()
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

            const response = await authFetch(`${API_URL}/expenses?startDate=${start}&endDate=${end}`)
            const data = await response.json()
            if (data.success) setExpenses(data.data)
        } catch (error) { console.error(error) }
    }

    const fetchBudgetStatus = async () => {
        try {
            const response = await authFetch(`${API_URL}/budget-status`)
            const data = await response.json()
            if (data.success) setBudgetStatus(data.data)
        } catch (error) { console.error(error) }
    }

    const formatMoney = (a) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(a)

    // Chart Prep
    const pieChartData = categories.filter(c => c.type === 'Gider')
        .map(c => ({ name: c.name, value: expenses.filter(e => e.category_id === c.id).reduce((s, e) => s + e.amount, 0) }))
        .filter(i => i.value > 0)

    const barChartData = [
        { name: 'Gelir', value: summary.total_income, fill: '#34D399' },
        { name: 'Gider', value: summary.total_expense, fill: '#F87171' }
    ]

    // Budget status - sadece limit belirlenmis kategoriler
    const activeBudgets = budgetStatus.filter(b => b.budget_limit > 0)

    // Progress bar renk belirleme
    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-rose-500'
        if (percentage >= 80) return 'bg-amber-500'
        return 'bg-emerald-500'
    }

    const getProgressBg = (percentage) => {
        if (percentage >= 100) return 'bg-rose-500/20'
        if (percentage >= 80) return 'bg-amber-500/20'
        return 'bg-emerald-500/20'
    }

    return (
        <div className="space-y-6">
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>📊 Bu Ayın Özeti</h1>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/10 text-white relative overflow-hidden group">
                    <div className="text-emerald-100 text-sm font-medium mb-1 relative z-10">Toplam Gelir</div>
                    <div className="text-3xl font-bold relative z-10">{formatMoney(summary.total_income)}</div>
                    <div className="absolute -right-4 -bottom-4 text-emerald-400/20 text-8xl group-hover:scale-110 transition-transform">💵</div>
                </div>

                <div className="rounded-2xl p-6 bg-gradient-to-br from-rose-500 to-red-600 shadow-xl shadow-rose-500/10 text-white relative overflow-hidden group">
                    <div className="text-rose-100 text-sm font-medium mb-1 relative z-10">Toplam Gider</div>
                    <div className="text-3xl font-bold relative z-10">{formatMoney(summary.total_expense)}</div>
                    <div className="absolute -right-4 -bottom-4 text-rose-400/20 text-8xl group-hover:scale-110 transition-transform">💸</div>
                </div>

                <div className={`rounded-2xl p-6 shadow-xl text-white relative overflow-hidden group ${summary.balance >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/10' : 'bg-gradient-to-br from-orange-500 to-red-600 shadow-orange-500/10'}`}>
                    <div className="text-white/80 text-sm font-medium mb-1 relative z-10">Net Bakiye</div>
                    <div className="text-3xl font-bold relative z-10">{formatMoney(summary.balance)}</div>
                    <div className="absolute -right-4 -bottom-4 text-white/10 text-8xl group-hover:scale-110 transition-transform">⚖️</div>
                </div>
            </div>

            {/* Budget Status */}
            {activeBudgets.length > 0 && (
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>💰 Bütçe Durumu</h2>
                    <div className="space-y-4">
                        {activeBudgets.map(budget => (
                            <div key={budget.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {budget.name}
                                        {budget.percentage >= 100 && <span className="ml-2">🔴</span>}
                                        {budget.percentage >= 80 && budget.percentage < 100 && <span className="ml-2">⚠️</span>}
                                    </span>
                                    <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {formatMoney(budget.spent)} / {formatMoney(budget.budget_limit)}
                                    </span>
                                </div>
                                <div className={`h-3 rounded-full overflow-hidden ${getProgressBg(budget.percentage)}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(budget.percentage)}`}
                                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className={`font-bold ${budget.percentage >= 100 ? 'text-rose-500' :
                                            budget.percentage >= 80 ? 'text-amber-500' :
                                                'text-emerald-500'
                                        }`}>
                                        %{budget.percentage}
                                    </span>
                                    {budget.percentage >= 100 && (
                                        <span className="text-rose-500 font-medium">
                                            Limit aşıldı! (+{formatMoney(budget.spent - budget.budget_limit)})
                                        </span>
                                    )}
                                    {budget.percentage >= 80 && budget.percentage < 100 && (
                                        <span className="text-amber-500 font-medium">
                                            Limite yaklaşıyor
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h2 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Gider Dağılımı</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                                    {pieChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={darkMode ? '#0f172a' : '#fff'} strokeWidth={3} />)}
                                </Pie>
                                <Tooltip formatter={(v) => formatMoney(v)} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h2 className={`text-lg font-bold mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Gelir vs Gider</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} barSize={60}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                                <YAxis axisLine={false} tickLine={false} stroke={darkMode ? '#94a3b8' : '#64748b'} tickFormatter={(v) => `₺${v / 1000}k`} />
                                <Tooltip formatter={(v) => formatMoney(v)} cursor={{ fill: darkMode ? '#1e293b' : '#f1f5f9' }} contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
