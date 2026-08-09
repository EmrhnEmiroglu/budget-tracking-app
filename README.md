# 💰 Budget Tracking App

Modern, kullanıcı dostu ve tam özellikli kişisel finans yönetimi web uygulaması. Gelirlerinizi, giderlerinizi ve aboneliklerinizi tek bir yerden takip edin.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)
![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram)

> 📱 Bu uygulamanın mobil sürümü ayrı bir depoda:
> [budget-tracker-expo](https://github.com/EmrhnEmiroglu/budget-tracker-expo)
> (Expo + React Native). İki uygulama aynı backend'i kullanır; hesabın
> ikisinde de geçerlidir.

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

### 🤖 Telegram Bot Entegrasyonu
- **Otomatik Hatırlatıcılar:** Abonelik ödeme günlerinde Telegram bildirimi
- **Hedef Hatırlatıcıları:** Finansal hedef son günlerinde bildirim
- **`/bakiye` Komutu:** Anlık bakiye, gelir ve gider özeti
- **`/ozet` Komutu:** Aylık kategori bazlı harcama analizi
- **Güvenlik:** Sadece belirlenen Chat ID'ye yanıt verir

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
| React Router 7 | Sayfa yönlendirme |
| Recharts | Grafikler |
| Lucide React | İkonlar |

### Backend (`/server`)
| Teknoloji | Açıklama |
|-----------|----------|
| Express 5 | Web framework |
| SQLite 3 | Veritabanı |
| JWT | Kimlik doğrulama |
| bcrypt | Şifre hashleme |
| node-telegram-bot-api | Telegram entegrasyonu |
| node-cron | Zamanlı görevler |
| Nodemon | Geliştirme sunucusu |

---

## 🚀 Kurulum

### Gereksinimler
- **Node.js** 18 veya üzeri
- **npm** veya **yarn**

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/EmrhnEmiroglu/budget-tracking-app.git
cd budget-tracking-app
```

### 2. Backend Kurulumu
```bash
cd server
npm install
cp .env.example .env
# .env dosyasını düzenleyin (JWT_SECRET ve Telegram ayarları)
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

## ⚙️ Ortam Değişkenleri

`server/.env` dosyasını oluşturun (`server/.env.example` dosyasını kopyalayabilirsiniz):

```env
# Zorunlu — tanımlı değilse sunucu başlamaz
JWT_SECRET=rastgele-uzun-bir-deger

# Telegram Bot (Opsiyonel)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_NOTIFY_TIME=09:00

# E-posta doğrulama — Gmail SMTP (Opsiyonel)
# EMAIL_PASS: Gmail uygulama şifresi (app password), normal hesap şifresi değil
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

`JWT_SECRET` için güvenli bir değer üretmek:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ `server/.env` dosyası gizli bilgiler içerir ve `.gitignore` ile depo dışında
> tutulur. Bu dosyayı asla herkese açık bir yere yüklemeyin.

### Telegram Bot Kurulumu
1. Telegram'da [@BotFather](https://t.me/BotFather) ile yeni bot oluşturun
2. Bot token'ı ve username'i `.env` dosyasına ekleyin
3. Sunucuyu yeniden başlatın
4. Uygulamada Telegram ikonuna tıklayıp hesabınızı bağlayın

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
budget-tracking-app/
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
│   │   │   ├── Notes.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── ...
│   │   ├── App.jsx            # Router yapısı
│   │   └── main.jsx           # Giriş noktası
│   └── package.json
│
└── server/                    # Backend (Express + SQLite)
    ├── index.js               # API sunucusu & endpoints
    ├── database.js            # Veritabanı işlemleri
    ├── auth.js                # JWT & middleware
    ├── services/
    │   └── notificationService.js # Telegram bot & cron jobs
    ├── subscriptionCatalog.js # Varsayılan katalog
    ├── subscriptionCatalog.json # Güncellenmiş katalog (admin tarafından)
    ├── .env.example           # Örnek ortam değişkenleri
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

## 🤖 Telegram Bot Komutları

| Komut | Açıklama |
|-------|----------|
| `/bakiye` | Mevcut bakiye, toplam gelir ve gider |
| `/ozet` | Bu ayın kategori bazlı harcama özeti |

Bot ayrıca otomatik olarak şu bildirimleri gönderir:
- 💰 Abonelik ödeme günlerinde hatırlatma
- 🎯 Hedef son tarihlerinde hatırlatma

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
