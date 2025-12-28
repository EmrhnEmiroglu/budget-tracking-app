import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { Plus, Trash2, CheckCircle, Circle, StickyNote, Calendar, Clock, AlertTriangle } from 'lucide-react'

const API_URL = 'http://localhost:5000/api'

export default function Notes() {
    const { authFetch } = useAuth()
    const { darkMode } = useOutletContext()
    const [notes, setNotes] = useState([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        try {
            const response = await authFetch(`${API_URL}/notes`)
            const data = await response.json()
            if (data.success) setNotes(data.data)
        } catch (error) { console.error(error) }
    }

    const addNote = async (e) => {
        e.preventDefault()
        if (!title.trim()) return

        try {
            const response = await authFetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, due_date: dueDate || null })
            })
            const data = await response.json()
            if (data.success) {
                setNotes([data.data, ...notes])
                setTitle('')
                setContent('')
                setDueDate('')
                setIsAdding(false)
            }
        } catch (error) { console.error(error) }
    }

    const toggleComplete = async (id, currentStatus) => {
        try {
            setNotes(notes.map(n => n.id === id ? { ...n, is_completed: !currentStatus } : n))
            await authFetch(`${API_URL}/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_completed: !currentStatus })
            })
        } catch (error) {
            console.error(error)
            fetchNotes()
        }
    }

    const deleteNote = async (id) => {
        if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return

        try {
            setNotes(notes.filter(n => n.id !== id))
            await authFetch(`${API_URL}/notes/${id}`, { method: 'DELETE' })
        } catch (error) {
            console.error(error)
            fetchNotes()
        }
    }

    // Kalan süre hesaplama
    const getRemainingTime = (dueDateStr) => {
        if (!dueDateStr) return null

        const now = new Date()
        const dueDate = new Date(dueDateStr)
        const diffMs = dueDate - now
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))

        if (diffMs < 0) {
            return { text: 'Süresi doldu', status: 'expired', diffMs }
        } else if (diffHours < 24) {
            return { text: `${diffHours} saat kaldı`, status: 'urgent', diffMs }
        } else if (diffDays <= 2) {
            return { text: `${diffDays} gün kaldı`, status: 'warning', diffMs }
        } else if (diffDays <= 7) {
            return { text: `${diffDays} gün kaldı`, status: 'normal', diffMs }
        } else {
            return { text: `${diffDays} gün kaldı`, status: 'safe', diffMs }
        }
    }

    const getBadgeClass = (status) => {
        switch (status) {
            case 'expired': return darkMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-100 text-rose-600 border-rose-200'
            case 'urgent': return darkMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-600 border-orange-200'
            case 'warning': return darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-600 border-amber-200'
            case 'normal': return darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-600 border-blue-200'
            case 'safe': return darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
            default: return darkMode ? 'bg-zinc-500/20 text-zinc-400' : 'bg-slate-100 text-slate-600'
        }
    }

    // Notları son tarihe göre sırala (yakın olanlar önce)
    const sortedNotes = [...notes].sort((a, b) => {
        // Tamamlanmış notlar en sona
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1

        // Son tarihi olmayanlar sona
        if (!a.due_date && !b.due_date) return new Date(b.created_at) - new Date(a.created_at)
        if (!a.due_date) return 1
        if (!b.due_date) return -1

        // Son tarihe göre sırala
        return new Date(a.due_date) - new Date(b.due_date)
    })

    const cardClass = `p-6 rounded-3xl border transition-all duration-300 relative group ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`
    const inputClass = `w-full p-3 rounded-xl outline-none transition-all ${darkMode ? 'bg-black/20 border-white/10 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'} border`

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notlar ve Hedefler</h1>
                    <p className={`mt-1 ${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Hedeflerinizi belirleyin ve notlarınızı tutun</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${isAdding
                        ? (darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                        }`}
                >
                    {isAdding ? 'Vazgeç' : <><Plus size={20} /> Yeni Ekle</>}
                </button>
            </div>

            {/* Add Note Form */}
            {isAdding && (
                <form onSubmit={addNote} className={`p-6 rounded-3xl border animate-in slide-in-from-top-4 duration-300 ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Başlık (Örn: Araba Birikimi)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`${inputClass} font-bold text-lg`}
                                autoFocus
                            />
                        </div>
                        <div>
                            <textarea
                                placeholder="Detaylar..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className={`${inputClass} min-h-[100px] resize-none`}
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                <Calendar size={14} className="inline mr-1" /> Son Tarih (Opsiyonel)
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Notes Grid */}
            {notes.length === 0 && !isAdding ? (
                <div className={`text-center py-20 rounded-3xl border border-dashed ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-300 bg-slate-50'}`}>
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-500'}`}>
                        <StickyNote size={32} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Henüz bir not eklemediniz</h3>
                    <p className={`${darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Yeni bir hedef veya not eklemek için butona tıklayın.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedNotes.map(note => {
                        const remaining = getRemainingTime(note.due_date)
                        return (
                            <div key={note.id} className={`${cardClass} hover:border-indigo-500/30 flex flex-col`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2.5 rounded-xl ${note.is_completed
                                        ? (darkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-100 text-emerald-600')
                                        : (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                                        }`}>
                                        <StickyNote size={20} />
                                    </div>

                                    {/* Kalan Süre Badge */}
                                    {remaining && !note.is_completed && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getBadgeClass(remaining.status)}`}>
                                            {remaining.status === 'expired' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                                            {remaining.text}
                                        </div>
                                    )}

                                    {note.is_completed && (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                            <CheckCircle size={12} /> Tamamlandı
                                        </div>
                                    )}
                                </div>

                                <h3 className={`text-lg font-bold mb-2 ${note.is_completed ? 'line-through opacity-50' : ''} ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {note.title}
                                </h3>

                                {note.content && (
                                    <p className={`text-sm mb-4 flex-1 whitespace-pre-wrap ${note.is_completed ? 'line-through opacity-50' : ''} ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                        {note.content}
                                    </p>
                                )}

                                <div className={`mt-auto pt-4 border-t flex items-center justify-between text-xs border-dashed ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                                    <div className={`flex items-center gap-2 font-mono ${darkMode ? 'text-zinc-600' : 'text-slate-400'}`}>
                                        <Calendar size={12} />
                                        {new Date(note.created_at).toLocaleDateString('tr-TR')}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => toggleComplete(note.id, note.is_completed)}
                                            className={`p-2 rounded-lg transition-colors ${note.is_completed
                                                ? 'text-emerald-500 hover:bg-emerald-500/10'
                                                : (darkMode ? 'text-zinc-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')
                                                }`}
                                            title={note.is_completed ? "Tamamlandı" : "Tamamla"}
                                        >
                                            {note.is_completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                        </button>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                                }`}
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
