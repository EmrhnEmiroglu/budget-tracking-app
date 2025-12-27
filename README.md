# 💰 Kişisel Gider Takibi

Modern ve kullanıcı dostu bir kişisel gider takibi web uygulaması.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

## 📋 Özellikler

- ✅ Modern ve responsive tasarım
- ✅ Backend sunucu durumu izleme
- ✅ Gerçek zamanlı bağlantı kontrolü
- 🔜 Gider ekleme ve listeleme
- 🔜 Kategori yönetimi
- 🔜 İstatistik ve grafikler

## 🛠️ Teknolojiler

### Frontend (client)
- **React 19** - UI framework
- **Vite 7** - Build aracı
- **Tailwind CSS 4** - Styling

### Backend (server)
- **Express 5** - Web framework
- **SQLite 3** - Veritabanı
- **CORS** - Cross-Origin desteği
- **Nodemon** - Geliştirme sunucusu

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adımlar

1. **Repoyu klonlayın:**
```bash
git clone https://github.com/EmrhnEmiroglu/GelirGider.git
cd GelirGider
```

2. **Backend bağımlılıklarını yükleyin:**
```bash
cd server
npm install
```

3. **Frontend bağımlılıklarını yükleyin:**
```bash
cd ../client
npm install
```

## 💻 Çalıştırma

### Backend (Terminal 1)
```bash
cd server
npm run dev
```
> Sunucu http://localhost:5000 adresinde çalışır

### Frontend (Terminal 2)
```bash
cd client
npm run dev
```
> Uygulama http://localhost:5173 adresinde çalışır

## 📁 Proje Yapısı

```
GelirGider/
├── client/                 # Frontend
│   ├── src/
│   │   ├── App.jsx        # Ana bileşen
│   │   ├── index.css      # Tailwind CSS
│   │   └── main.jsx       # Giriş noktası
│   ├── package.json
│   └── vite.config.js
│
└── server/                 # Backend
    ├── index.js           # Express sunucusu
    ├── .env               # Ortam değişkenleri
    └── package.json
```

## 🔌 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/health` | Sunucu durumu kontrolü |

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
