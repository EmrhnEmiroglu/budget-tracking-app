import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Wallet, TrendingUp, TrendingDown, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'
const COLORS = ['#818cf8', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#2dd4bf']

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
        } catch (error) { console.error(error) }
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
        { name: 'Gelir', value: summary.total_income, fill: '#34d399' },
        { name: 'Gider', value: summary.total_expense, fill: '#f87171' }
    ]

    const activeBudgets = budgetStatus.filter(b => b.budget_limit > 0)

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-rose-500'
        if (percentage >= 80) return 'bg-amber-500'
        return 'bg-emerald-500'
    }

    const getProgressBg = (percentage) => {
        if (percentage >= 100) return 'bg-rose-500/10'
        if (percentage >= 80) return 'bg-amber-500/10'
        return 'bg-emerald-500/10'
    }

    // Common card styles
    const cardClass = `p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`
    const iconBoxClass = (color) => `w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`

    return (
        <div className="space-y-6">
            <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Bu Ay</h1>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Summary Cards */}
                <div className={`${cardClass} group hover:border-indigo-500/20`}>
                    <div className={iconBoxClass(darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Toplam Gelir</div>
                    <div className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {formatMoney(summary.total_income)}
                    </div>
                </div>

                <div className={`${cardClass} group hover:border-rose-500/20`}>
                    <div className={iconBoxClass(darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')}>
                        <TrendingDown size={24} />
                    </div>
                    <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Toplam Gider</div>
                    <div className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {formatMoney(summary.total_expense)}
                    </div>
                </div>

                <div className={`${cardClass} group hover:border-emerald-500/20`}>
                    <div className={iconBoxClass(darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}>
                        <Wallet size={24} />
                    </div>
                    <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Net Bakiye</div>
                    <div className={`text-3xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatMoney(summary.balance)}
                    </div>
                </div>

                {/* Charts Area - Bento Grid Span */}
                <div className={`${cardClass} md:col-span-2 min-h-[400px]`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Harcama Analizi</h2>
                            <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Kategorilere göre gider dağılımı</p>
                        </div>
                        <div className={`p-2 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                            <CreditCard size={20} className={darkMode ? 'text-zinc-400' : 'text-slate-500'} />
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={6}
                                >
                                    {pieChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#18181b' : '#fff',
                                        borderRadius: '16px',
                                        border: darkMode ? '1px solid #27272a' : '1px solid #e4e4e7',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                    formatter={(value) => [formatMoney(value), 'Tutar']}
                                />
                                <Legend iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`${cardClass} min-h-[400px]`}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Gelir / Gider</h2>
                            <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Finansal denge özeti</p>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} barSize={40}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    stroke={darkMode ? '#52525b' : '#94a3b8'}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: darkMode ? '#27272a' : '#f4f4f5', radius: 8 }}
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#18181b' : '#fff',
                                        borderRadius: '16px',
                                        border: darkMode ? '1px solid #27272a' : '1px solid #e4e4e7',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                    formatter={(value) => [formatMoney(value), 'Tutar']}
                                />
                                <Bar dataKey="value" name="Tutar" radius={[8, 8, 8, 8]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Budget Status - Full Width */}
                {activeBudgets.length > 0 && (
                    <div className={`${cardClass} md:col-span-3`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Bütçe Hedefleri</h2>
                                <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Aylık harcama limitleri</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeBudgets.map(budget => (
                                <div key={budget.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            {budget.name}
                                        </span>
                                        <span className={`text-xs font-mono px-2 py-1 rounded-lg ${darkMode ? 'bg-white/5 text-zinc-400' : 'bg-white border text-slate-500'}`}>
                                            {formatMoney(budget.spent)} / {formatMoney(budget.budget_limit)}
                                        </span>
                                    </div>

                                    <div className="relative h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 mb-2">
                                        <div
                                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${getProgressColor(budget.percentage)}`}
                                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className={`font-bold ${budget.percentage >= 100 ? 'text-rose-500' :
                                            budget.percentage >= 80 ? 'text-amber-500' :
                                                'text-emerald-500'
                                            }`}>
                                            %{budget.percentage} Kullanıldı
                                        </span>

                                        {budget.percentage >= 100 ? (
                                            <span className="flex items-center gap-1 text-rose-500 font-medium">
                                                <AlertTriangle size={12} /> Limit Aşıldı
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                                <CheckCircle size={12} /> İyi Durumda
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
