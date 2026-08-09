// Merkezi uygulama yapılandırması.
//
// API adresi öncelikle Vite ortam değişkeninden (VITE_API_URL) okunur,
// tanımlı değilse yerel geliştirme adresine düşer.
// Deploy ortamında client/.env dosyasına şunu ekleyin:
//   VITE_API_URL=https://api.alanadiniz.com/api
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
