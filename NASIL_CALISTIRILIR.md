# Bütçe Takip Sistemi — Nasıl Çalıştırılır?

Web tabanlı kişisel gelir-gider takip uygulaması.
**Frontend:** React + Vite · **Backend:** Node.js + Express + SQLite

---

## Gereksinimler (ilk kez çalıştıranlar için)

- **Node.js** (v18 veya üzeri) — [nodejs.org](https://nodejs.org) adresinden indirilir.
  Kurulu mu kontrol: terminalde `node --version` yazın.

---

## İlk Kurulum: .env dosyası (zorunlu)

Sunucu, gizli ayarları `server/.env` dosyasından okur. Bu dosya depoya dahil değildir,
ilk çalıştırmadan önce kendiniz oluşturmalısınız:

1. `server/.env.example` dosyasını kopyalayıp adını `server/.env` yapın.
2. `JWT_SECRET` satırına rastgele bir değer yazın. Üretmek için terminalde:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`JWT_SECRET` boşsa sunucu açılmaz ve size bu adımı hatırlatır. Telegram ve e-posta
ayarları isteğe bağlıdır; boş bırakılırsa yalnızca o özellikler devre dışı kalır.

---

## En Kolay Yöntem: Çift Tıkla

Proje klasöründeki **`BASLAT.bat`** dosyasına çift tıklayın.

- İlk açılışta gerekli paketleri otomatik kurar (biraz sürebilir).
- İki pencere açılır (biri sunucu, biri arayüz) — **bunları kapatmayın**.
- Tarayıcıda şu adresi açın: **http://localhost:5173**

Kapatmak için: açılan iki siyah pencereyi kapatın.

---

## Manuel Yöntem (iki ayrı terminal)

**1. Terminal — Sunucu:**
```
cd server
npm install     (sadece ilk kez)
npm start
```
"🚀 Sunucu http://localhost:5000 adresinde çalışıyor" yazınca hazırdır.

**2. Terminal — Arayüz:**
```
cd client
npm install     (sadece ilk kez)
npm run dev
```
"Local: http://localhost:5173/" yazınca hazırdır.

**3.** Tarayıcıda **http://localhost:5173** adresini açın.

Kapatmak için her iki terminalde **Ctrl + C**.

---

## Notlar

- **Sunucu (port 5000) ile arayüz (port 5173) AYNI ANDA çalışmalı.** Biri kapalıysa uygulama veri çekemez.
- Veriler `server/database.sqlite` dosyasında tutulur (otomatik oluşur).
- Telegram bildirimleri ve e-posta doğrulaması için `server/.env` dosyasındaki ayarlar kullanılır.

### Hesap Oluşturma
Kayıt olurken e-posta adresinize 6 haneli doğrulama kodu gönderilir; bu kodu girerek hesabınızı doğrulayıp giriş yaparsınız.

---

## ⚠️ Paylaşım / Güvenlik Notu

`server/.env` dosyası **gizli bilgiler içerir** (e-posta uygulama şifresi, Telegram bot token'ı, JWT anahtarı).

- **Git ile paylaşırken** sorun yok: `.env` zaten `.gitignore`'da, gönderilmez.
- **Klasörü ZIP'leyip paylaşıyorsanız**, ZIP'i oluşturmadan ÖNCE `server/.env` dosyasını **silin veya içindeki şifreleri boşaltın**. Karşı taraf `server/.env.example` dosyasını `server/.env` olarak kopyalayıp kendi bilgilerini girerek çalıştırabilir.
- Asla gerçek `.env` dosyasını jüriye/herkese açık ortama yüklemeyin.
