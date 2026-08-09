# Bütçe Takip Sistemi — Proje Anlatım Rehberi (Sunum İçin)

Bu belge, projeyi jüriye anlatırken sana yardımcı olması için hazırlanmıştır.
Mimari, veritabanı, dosyaların görevleri, örnek akışlar ve olası jüri soruları-cevaplarını içerir.

---

## 1. PROJE NEDİR?

**Kişisel Bütçe Takip Sistemi** — kullanıcıların gelir-giderlerini, aboneliklerini ve
bütçelerini tek bir web arayüzünden takip edebildiği, **web tabanlı bir finans uygulaması**.

**Öne çıkan özellikler:**
- Gelir/gider kaydı, kategoriler, aylık özet ve grafikler
- Abonelik takibi ve aylık ödeme takvimi
- E-posta doğrulamalı güvenli kayıt/giriş
- Telegram botu ile otomatik bildirim (abonelik hatırlatma, aylık özet)
- Yönetici (admin) paneli

---

## 2. GENEL MİMARİ — "İki ayrı uygulama"

Proje iki parçadan oluşur ve bunlar ayrı çalışıp HTTP üzerinden konuşur:

```
  FRONTEND (client/)                BACKEND (server/)              VERİTABANI
  React + Vite                      Node.js + Express              SQLite
  Tarayıcıda çalışır     ──HTTP──►  İş mantığı + güvenlik  ──►     database.sqlite
  Port 5173                         Port 5000                      (tek dosya)
                         ◄─JSON──
```

**Tek cümlelik özet:** *"İstemci-sunucu mimarisi kullandım. Tarayıcıdaki React arayüzü,
ayrı bir Node.js sunucusuna istek atıyor; sunucu verileri SQLite veritabanında saklıyor."*

**Neden ayrı?** Frontend ve backend bağımsız geliştirilebilir, bakımı kolaydır,
ileride mobil uygulama da aynı backend'i kullanabilir.

---

## 3. VERİTABANI — Veriler Nereye Kaydediliyor?

**Cevap:** `server/database.sqlite` adlı **tek bir dosyaya** (SQLite veritabanı).

**SQLite nedir?** Ayrı bir sunucu programı gerektirmeyen, tek dosyada çalışan ilişkisel
veritabanıdır. Tüm veri o `.sqlite` dosyasında durur.

**Tablolar** (hepsi `server/database.js` içinde `CREATE TABLE` ile tanımlı):

| Tablo | İçeriği |
|---|---|
| `users` | Kullanıcılar: ad, email, **şifre (hash'li)**, is_admin, e-posta doğrulama alanları, Telegram bilgileri |
| `categories` | Kategoriler (Market, Fatura, Maaş...) + aylık bütçe limitleri |
| `expenses` | Gelir/gider işlemleri: tutar, açıklama, tarih, kategori |
| `subscriptions` | Abonelikler: ad, tutar, ödeme günü (billing_day) |
| `notes` | Notlar/hatırlatıcılar |

**Tablolar nasıl ilişkili?** **Yabancı anahtarlarla** (`user_id`, `category_id`).
Her harcamada bir `user_id` vardır → harcama kime ait belli olur. Böylece **her kullanıcı
yalnızca kendi verisini görür** (veri izolasyonu).

---

## 4. BACKEND DOSYALARI (server/)

| Dosya | Görevi |
|---|---|
| **index.js** | Sunucunun ana dosyası. Tüm API endpoint'leri (37 adet) burada. Hangi adrese istek gelirse ilgili fonksiyon çalışır. |
| **database.js** | Veritabanı katmanı. Tabloları oluşturur + TÜM SQL sorguları burada (ekle/oku/güncelle/sil). |
| **auth.js** | Güvenlik. JWT token üretir/doğrular. `authMiddleware` (giriş kontrolü) + `adminMiddleware` (admin kontrolü). |
| **services/emailService.js** | Gmail SMTP ile e-posta gönderir (doğrulama kodları). |
| **services/notificationService.js** | Telegram botu + zamanlanmış bildirimler (node-cron). |
| **subscriptionCatalog.js / .json** | Hazır abonelik kataloğu (Netflix, Spotify vb.). |

### API Endpoint'leri ne demek?
Her endpoint bir "kapı"dır. Örnek:
- `POST /api/auth/login` → giriş yap
- `GET /api/expenses` → harcamalarımı getir
- `POST /api/expenses` → yeni harcama ekle
- `DELETE /api/expenses/:id` → harcama sil

`GET`=oku, `POST`=oluştur, `PUT`=güncelle, `DELETE`=sil (REST mimarisi).

---

## 5. FRONTEND DOSYALARI (client/src/)

| Dosya | Görevi |
|---|---|
| **main.jsx** | Başlangıç noktası — React'i sayfaya bağlar. |
| **App.jsx** | Yönlendirme (routing): hangi adres → hangi sayfa. Giriş yoksa korumalı sayfalara sokmaz. |
| **context/AuthContext.jsx** | Oturum yönetimi: giriş/çıkış/kayıt, token saklama. `authFetch` = her isteğe token ekler. |
| **components/MainLayout.jsx** | Sol menü + üst çubuk (ortak çerçeve). |
| **components/ui.jsx** | Tekrar kullanılabilir tasarım parçaları (Kart, Buton, Para, Grafik). |
| **context + pages** | Her ekran ayrı dosya (aşağıda). |

**Sayfalar (pages/):**
- `Dashboard.jsx` — Özet ekranı (bakiye, grafikler, harcama trendi)
- `Transactions.jsx` — Tüm gelir/gider listesi, filtreleme
- `AddTransaction.jsx` — Yeni işlem ekleme formu
- `Subscriptions.jsx` — Abonelikler + aylık ödeme takvimi
- `Notes.jsx` — Notlar
- `Settings.jsx` — Ayarlar (profil, şifre, kategoriler, Telegram)
- `Login.jsx` / `Register.jsx` — Giriş / Kayıt (e-posta doğrulamalı)
- `CatalogManagement.jsx` — Admin: abonelik kataloğu yönetimi

---

## 6. GÜVENLİK — Nasıl Sağlandı?

1. **Şifreler asla düz metin tutulmaz.** `bcrypt` ile şifrelenir (hash). Veritabanı çalınsa
   bile şifreler okunamaz. (`database.js` → `bcrypt.hash`)

2. **JWT (JSON Web Token) ile kimlik doğrulama.** Kullanıcı giriş yapınca sunucu imzalı bir
   token üretir, tarayıcı bunu saklar ve her istekte gönderir. Sunucu token'ı doğrulayıp
   "bu kişi gerçekten giriş yapmış" diye onaylar. (`auth.js`)

3. **E-posta doğrulama.** Kayıt olurken e-postaya 6 haneli kod gider; doğrulanmadan giriş yok.
   Şifre sıfırlamada da kod zorunlu → başkası senin e-postanı bilse bile şifreni değiştiremez.

4. **Veri izolasyonu.** Her sorgu `user_id` ile filtrelenir → kimse başkasının verisini göremez.

5. **`.env` dosyası.** Gizli bilgiler (e-posta şifresi, JWT anahtarı, bot token) koda değil,
   `.env` dosyasına yazılır ve `.gitignore` ile paylaşımdan dışlanır.

---

## 7. ÖRNEK AKIŞLAR (uçtan uca)

### A) Kullanıcı giriş yapınca
```
1. Login.jsx → email+şifre ile POST /api/auth/login
2. index.js → findUserByEmail (database.js) ile kullanıcıyı bulur
3. bcrypt.compare ile şifreyi doğrular
4. is_verified=1 mi kontrol eder (doğrulanmamışsa engeller)
5. auth.js → generateToken ile JWT üretir
6. Token frontend'e döner → localStorage'a kaydedilir → kullanıcı içeri girer
```

### B) Harcama eklenince
```
1. AddTransaction.jsx → form → authFetch ile POST /api/expenses (token+veri)
2. auth.js (authMiddleware) → token'ı doğrular
3. index.js → veriyi kontrol eder (tutar/tarih/kategori var mı?)
4. database.js → INSERT INTO expenses → SQLite'a yazar
5. "başarılı" yanıtı → kullanıcı işlem listesine yönlendirilir
```

### C) Telegram bildirimi
```
1. notificationService.js içinde node-cron her gün 09:00'da çalışır
2. O gün ödemesi gelen abonelikleri bulur (database.js)
3. Telegram botu üzerinden kullanıcıya mesaj gönderir
```

---

## 8. KULLANILAN TEKNOLOJİLER

**Frontend:** React 19, Vite, React Router (sayfa yönlendirme), Recharts (grafikler)
**Backend:** Node.js, Express (web sunucusu çatısı)
**Veritabanı:** SQLite
**Güvenlik:** JWT (jsonwebtoken), bcrypt (şifre hash)
**Entegrasyon:** nodemailer (e-posta), node-telegram-bot-api + node-cron (Telegram & zamanlama)

---

## 9. MUHTEMEL JÜRİ SORULARI VE CEVAPLARI

**S: Verileri nerede saklıyorsun?**
C: SQLite veritabanında, `server/database.sqlite` dosyasında. 5 tablo var: users, categories,
expenses, subscriptions, notes.

**S: Neden SQLite? Neden MySQL değil?**
C: SQLite kurulum gerektirmez, tek dosyada çalışır, taşınması kolaydır. Bu ölçekteki bir proje
için yeterli. İhtiyaç olursa PostgreSQL/MySQL'e geçiş yapılabilir çünkü veritabanı kodu tek
katmanda (database.js) toplandı.

**S: Şifreler nasıl saklanıyor? Güvenli mi?**
C: Şifreler asla düz metin tutulmuyor, bcrypt ile hash'leniyor. Veritabanı ele geçse bile
şifreler geri çözülemez.

**S: Kullanıcı doğrulamasını nasıl yapıyorsun? (Kimlik doğrulama)**
C: JWT token ile. Giriş yapınca sunucu imzalı bir token üretiyor, tarayıcı her istekte bunu
gönderiyor, sunucu doğruluyor. Ayrıca e-posta doğrulaması var: kayıtta e-postaya kod gidiyor.

**S: Bir kullanıcı başkasının verisini görebilir mi?**
C: Hayır. Her veritabanı sorgusu user_id ile filtreleniyor. Token'dan gelen kullanıcı kimliği
dışındaki veriye erişilemez.

**S: Frontend ve backend nasıl haberleşiyor?**
C: HTTP üzerinden REST API ile. Frontend `fetch` ile istek atıyor, backend JSON yanıt dönüyor.

**S: Bu kod bloğu ne işe yarıyor? (genel cevap kalıbı)**
C: "Bu, [dosya adı] içinde. Görevi [X]. Örneğin kullanıcı [Y] yapınca bu fonksiyon çalışıp
[Z] işlemini gerçekleştiriyor." (Bölüm 4-5'teki tabloları kullan.)

**S: En çok zorlandığın kısım neydi?**
C: (Kendi deneyiminden bahset — örn. e-posta doğrulama akışını kurmak, bildirimlerin doğru
kullanıcıya gitmesini sağlamak, Türkçe karakter/encoding yönetimi gibi.)

**S: Projeyi nasıl çalıştırıyorsun?**
C: BASLAT.bat dosyasına çift tıklıyorum; sunucu (5000) ve arayüz (5173) açılıyor, tarayıcıda
http://localhost:5173 adresinden kullanıyorum.

---

## 10. PROJEYİ ÇALIŞTIRMA (hatırlatma)

- **Kolay yol:** `BASLAT.bat`'a çift tıkla → tarayıcı otomatik açılır.
- **Durdurma:** `DURDUR.bat`.
- **Manuel:** `server` klasöründe `npm start`, `client` klasöründe `npm run dev`.
- Detay: `NASIL_CALISTIRILIR.md`
