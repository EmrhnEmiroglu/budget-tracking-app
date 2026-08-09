import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Check, X, StickyNote } from 'lucide-react'
import { Card, Badge, fmtDate } from '../components/ui'

import { API_URL } from '../config'

export default function Notes() {
  const { authFetch } = useAuth()
  const [notes, setNotes] = useState([])
  const [tab, setTab] = useState('notes')
  const [addModal, setAddModal] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  const fetchNotes = async () => {
    try {
      const res = await authFetch(`${API_URL}/notes`)
      const data = await res.json()
      if (data.success) setNotes(data.data)
    } catch { }
  }

  const addNote = async (fields) => {
    try {
      const res = await authFetch(`${API_URL}/notes`, {
        method: 'POST',
        body: JSON.stringify(fields)
      })
      const data = await res.json()
      if (data.success) {
        setNotes(p => [data.data, ...p])
        setAddModal(false)
      }
    } catch { }
  }

  const toggleComplete = async (id, current) => {
    try {
      setNotes(p => p.map(n => n.id === id ? { ...n, is_completed: !current } : n))
      await authFetch(`${API_URL}/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_completed: !current })
      })
    } catch { fetchNotes() }
  }

  const deleteNote = async (id) => {
    try {
      setNotes(p => p.filter(n => n.id !== id))
      await authFetch(`${API_URL}/notes/${id}`, { method: 'DELETE' })
    } catch { fetchNotes() }
  }

  const activeNotes = notes.filter(n => !n.is_completed)
  const completedNotes = notes.filter(n => n.is_completed)

  const getDaysUntil = (dueDateStr) => {
    if (!dueDateStr) return null
    const due = new Date(dueDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.round((due - today) / 86400000)
  }

  return (
    <div className="px-8 py-6 space-y-5 rise-stagger" style={{ maxWidth: 1480, margin: '0 auto' }}>

      {/* Tab bar + action */}
      <div className="flex items-center justify-between">
        <div className="toggle-pill">
          {[['notes', 'Notlar', activeNotes.length], ['done', 'Tamamlanan', completedNotes.length]].map(([v, l, n]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className="px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2"
              style={{
                background: tab === v ? 'var(--accent)' : 'transparent',
                color: tab === v ? 'white' : 'var(--text-2)'
              }}
            >
              {l}
              <span
                className="mono text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  background: tab === v ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)',
                  color: tab === v ? 'white' : 'var(--text-3)'
                }}
              >
                {n}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold btn-primary"
        >
          <Plus size={16} /> Yeni Not
        </button>
      </div>

      {/* Notes masonry */}
      {(tab === 'notes' ? activeNotes : completedNotes).length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <div
              className="mb-4 w-16 h-16 rounded-3xl flex items-center justify-center"
              style={{ background: 'color-mix(in oklab, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
            >
              <StickyNote size={28} />
            </div>
            <div className="display text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {tab === 'notes' ? 'Henüz not yok' : 'Tamamlanan not yok'}
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
              {tab === 'notes' ? 'Hatırlatıcı veya not eklemek için yukarıdaki butonu kullanın.' : 'Tamamlanan notlar burada görünecek.'}
            </div>
            {tab === 'notes' && (
              <button
                onClick={() => setAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold btn-primary"
              >
                <Plus size={16} /> Yeni Not Ekle
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {(tab === 'notes' ? activeNotes : completedNotes).map(n => {
            const dueDays = getDaysUntil(n.due_date)
            const tone = dueDays == null ? 'neutral' : dueDays <= 1 ? 'danger' : dueDays <= 5 ? 'warning' : 'neutral'
            return (
              <Card key={n.id} pad="p-5" className="break-inside-avoid mb-4 group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.due_date && (
                      <Badge tone={tone}>
                        {dueDays == null ? '' : dueDays <= 0 ? 'geçti' : dueDays + ' gün'}
                      </Badge>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <button
                      onClick={() => toggleComplete(n.id, n.is_completed)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: n.is_completed ? 'var(--success)' : 'var(--text-3)' }}
                      title={n.is_completed ? 'Geri al' : 'Tamamla'}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ color: 'var(--text-3)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div
                  className="display text-[16px] font-semibold leading-snug"
                  style={{
                    color: 'var(--text)',
                    textDecoration: n.is_completed ? 'line-through' : 'none',
                    opacity: n.is_completed ? 0.5 : 1
                  }}
                >
                  {n.title}
                </div>

                {n.content && (
                  <div className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    {n.content}
                  </div>
                )}

                {n.due_date && (
                  <div className="mt-3 text-[11px] mono flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
                    {fmtDate(n.due_date.split('T')[0])}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setAddModal(false)}
        >
          <AddNoteForm
            onClose={() => setAddModal(false)}
            onSave={addNote}
          />
        </div>
      )}
    </div>
  )
}

function AddNoteForm({ onClose, onSave }) {
  const [f, setF] = useState({ title: '', content: '', due_date: '' })

  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))

  return (
    <div
      className="card w-[460px] max-w-full p-6 rise"
      onClick={e => e.stopPropagation()}
    >
      <div className="display text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Yeni Not</div>
      <div className="space-y-3">
        <div className="field px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>başlık</div>
          <input value={f.title} onChange={set('title')} placeholder="Not başlığı" className="text-sm" autoFocus />
        </div>
        <div className="field px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>açıklama</div>
          <textarea rows={3} value={f.content} onChange={set('content')} className="text-sm resize-none" placeholder="Detaylar..." />
        </div>
        <div className="field px-3 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.15em] mono mb-1" style={{ color: 'var(--text-3)' }}>son tarih</div>
          <input type="date" value={f.due_date} onChange={set('due_date')} className="text-sm mono" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-medium"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <X size={14} /> İptal
        </button>
        <button
          onClick={() => f.title.trim() && onSave({ title: f.title, content: f.content, due_date: f.due_date || null })}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-semibold btn-primary"
        >
          <Check size={14} /> Kaydet
        </button>
      </div>
    </div>
  )
}
