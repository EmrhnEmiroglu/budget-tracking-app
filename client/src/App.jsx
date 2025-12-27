import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health')
        const data = await response.json()

        if (data.status === 'ok') {
          setStatus('connected')
          setMessage(data.message)
          setTimestamp(new Date(data.timestamp).toLocaleString('tr-TR'))
        } else {
          setStatus('error')
          setMessage('Sunucu yanıtı beklenmeyen formatta')
        }
      } catch (error) {
        setStatus('disconnected')
        setMessage('Sunucuya bağlanılamadı')
        console.error('Health check error:', error)
      }
    }

    checkHealth()
    // Her 10 saniyede bir kontrol et
    const interval = setInterval(checkHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
          icon: '✓',
          text: 'Bağlı',
          ringColor: 'ring-emerald-400',
          pulseColor: 'bg-emerald-400'
        }
      case 'disconnected':
        return {
          bg: 'bg-gradient-to-br from-red-500 to-rose-600',
          icon: '✕',
          text: 'Bağlantı Yok',
          ringColor: 'ring-red-400',
          pulseColor: 'bg-red-400'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          icon: '⚠',
          text: 'Hata',
          ringColor: 'ring-amber-400',
          pulseColor: 'bg-amber-400'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-500 to-slate-600',
          icon: '○',
          text: 'Yükleniyor...',
          ringColor: 'ring-slate-400',
          pulseColor: 'bg-slate-400'
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <h1 className="text-2xl font-bold text-white text-center tracking-wide">
              💰 Kişisel Gider Takibi
            </h1>
            <p className="text-indigo-200 text-center text-sm mt-1">
              Finanslarınızı kontrol altında tutun
            </p>
          </div>

          {/* Status Panel */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white/90 mb-2">
                Sunucu Durumu
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <div className={`relative ${config.bg} px-8 py-4 rounded-2xl shadow-lg ring-2 ${config.ringColor} ring-offset-2 ring-offset-slate-900`}>
                {status === 'loading' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
                <div className={`flex items-center gap-3 ${status === 'loading' ? 'opacity-0' : ''}`}>
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-white font-bold text-lg">{config.text}</span>
                </div>

                {/* Pulse animation for connected status */}
                {status === 'connected' && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-4 w-4 ${config.pulseColor}`}></span>
                  </span>
                )}
              </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {message && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                    <span>📝</span>
                    <span>Mesaj</span>
                  </div>
                  <p className="text-white font-medium">{message}</p>
                </div>
              )}

              {timestamp && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                    <span>🕐</span>
                    <span>Son Güncelleme</span>
                  </div>
                  <p className="text-white font-medium">{timestamp}</p>
                </div>
              )}

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                  <span>🌐</span>
                  <span>API Endpoint</span>
                </div>
                <p className="text-white font-mono text-sm">http://localhost:5000/api/health</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white/5 px-6 py-4 border-t border-white/10">
            <p className="text-center text-white/50 text-sm">
              Her 10 saniyede otomatik güncellenir
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
