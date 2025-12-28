# 💰 Finans - Kişisel Gelir Gider Takibi

Modern, kullanıcı dostu ve tam özellikli kişisel finans yönetimi web uygulaması. Gelirlerinizi, giderlerinizi ve aboneliklerinizi tek bir yerden takip edin.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

---

## ✨ Özellikler

### 📊 Dashboard (Özet)
- Aylık gelir/gider özeti
- Görsel pasta ve çizgi grafikleri
- Yaklaşan abonelik ödemeleri
- Bütçe durumu takibi

### 💳 Harcama Yönetimi
- Gelir ve gider ekleme
- Kategori bazlı sınıflandırma
- Tarih filtreleme
- Harcama geçmişi

### 📱 Abonelik Takibi
- Netflix, Spotify, YouTube gibi popüler servislerin hazır kataloğu
- Otomatik logo ve marka rengi tanıma
- Ödeme günü hatırlatıcısı
- Aylık toplam abonelik maliyeti hesaplama
- **Abonelik fiyatı düzenleme** (Pencil icon ile)

### 🛡️ Admin Panel (Katalog Yönetimi)
- Abonelik kataloğunu yönetme
- Yeni servis ekleme (Disney+, HBO Max vb.)
- Plan adı ve fiyat düzenleme
- Yeni plan ekleme / silme
- Servis silme

### 📝 Notlar & Hedefler
- Finansal hedefler belirleme
- Notlar ve hatırlatıcılar

### 🎨 Kullanıcı Deneyimi
- **Dark/Light Mode** desteği
- Responsive tasarım (mobil uyumlu)
- Modern Bento Grid tasarımı
- Smooth animasyonlar

---

## 🛠️ Teknolojiler

### Frontend (`/client`)
| Teknoloji | Açıklama |
|-----------|----------|
| React 19 | UI framework |
| Vite 7 | Build aracı |
| Tailwind CSS 4 | Utility-first CSS |
| React Router | Sayfa yönlendirme |
| Recharts | Grafikler |
| Lucide React | İkonlar |

### Backend (`/server`)
| Teknoloji | Açıklama |
|-----------|----------|
| Express 5 | Web framework |
| SQLite 3 | Veritabanı |
| JWT | Kimlik doğrulama |
| bcrypt | Şifre hashleme |
| Nodemon | Geliştirme sunucusu |

---

## 🚀 Kurulum

### Gereksinimler
- **Node.js** 18 veya üzeri
- **npm** veya **yarn**

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/EmrhnEmiroglu/GelirGider.git
cd GelirGider
```

### 2. Backend Kurulumu
```bash
cd server
npm install
```

### 3. Frontend Kurulumu
```bash
cd ../client
npm install
```

---

## 💻 Çalıştırma

### Backend Sunucusunu Başlatın (Terminal 1)
```bash
cd server
npm run dev
```
> ✅ API sunucusu: `http://localhost:5000`

### Frontend Uygulamasını Başlatın (Terminal 2)
```bash
cd client
npm run dev
```
> ✅ Web uygulaması: `http://localhost:5173`

---

## 👤 İlk Kullanım

1. **Kayıt Olun:** `/register` sayfasından yeni hesap oluşturun
2. **Giriş Yapın:** Email ve şifrenizle giriş yapın
3. **Keşfedin:** Dashboard'dan finanslarınızı takip etmeye başlayın!

### 🔐 Admin Yetkisi Almak
Admin paneline erişmek için veritabanında kullanıcınızı admin yapın:

```bash
cd server
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./database.sqlite'); db.run('UPDATE users SET is_admin = 1 WHERE email = ?', ['your@email.com'], function(err) { console.log('Güncellendi:', this.changes); db.close(); });"
```

Sonra uygulamadan çıkış yapıp tekrar giriş yapın. Sidebar'da "Katalog Yönetimi" görünecektir.

---

## 📁 Proje Yapısı

```
GelirGider/
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Ortak bileşenler
│   │   │   └── MainLayout.jsx # Ana sayfa düzeni & sidebar
│   │   ├── context/           # React context
│   │   │   └── AuthContext.jsx# Kimlik doğrulama
│   │   ├── pages/             # Sayfa bileşenleri
│   │   │   ├── Dashboard.jsx  # Özet sayfası
│   │   │   ├── Transactions.jsx
│   │   │   ├── Subscriptions.jsx
│   │   │   ├── CatalogManagement.jsx # Admin panel
│   │   │   └── ...
│   │   ├── App.jsx            # Router yapısı
│   │   └── main.jsx           # Giriş noktası
│   └── package.json
│
└── server/                    # Backend (Express + SQLite)
    ├── index.js               # API sunucusu & endpoints
    ├── database.js            # Veritabanı işlemleri
    ├── auth.js                # JWT & middleware
    ├── subscriptionCatalog.js # Varsayılan katalog
    ├── subscriptionCatalog.json # Güncellenmiş katalog (admin tarafından)
    └── database.sqlite        # SQLite veritabanı
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Giriş yap |
| GET | `/api/auth/me` | Kullanıcı bilgisi |

### Harcamalar
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/expenses` | Harcamaları listele |
| POST | `/api/expenses` | Harcama ekle |
| DELETE | `/api/expenses/:id` | Harcama sil |

### Abonelikler
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/subscriptions` | Abonelikleri listele |
| POST | `/api/subscriptions` | Abonelik ekle |
| PUT | `/api/subscriptions/:id` | Abonelik güncelle |
| DELETE | `/api/subscriptions/:id` | Abonelik sil |
| GET | `/api/subscription-catalog` | Katalog getir |

### Admin
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/admin/update-catalog` | Kataloğu güncelle (Admin) |

---

## 🎯 Ekran Görüntüleri

### Dashboard
- Aylık özet kartları
- Pasta grafik (kategori dağılımı)
- Çizgi grafik (günlük harcamalar)
- Yaklaşan ödemeler

### Abonelikler
- Marka logoları (otomatik fallback)
- Renkli kartlar
- Ödeme günü sayacı

### Admin Panel
- Servis listesi
- Plan düzenleme
- Yeni servis/plan ekleme

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje **MIT** lisansı altında lisanslanmıştır.

---

## 👨‍💻 Geliştirici

**Emirhan Emiroğlu**

- GitHub: [@EmrhnEmiroglu](https://github.com/EmrhnEmiroglu)

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
