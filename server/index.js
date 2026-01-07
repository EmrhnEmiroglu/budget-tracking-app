require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  initializeDatabase,
  getAllCategories,
  addUserCategory,
  setCategoryBudget,
  getBudgetStatus,
  addExpense,
  getAllExpenses,
  getFilteredExpenses,
  getMonthlySummary,
  deleteExpense,
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  getAllNotes,
  addNote,
  updateNote,
  deleteNote,
  getAllSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getPendingPayments,
  getExpenseAnalysis,
  // Telegram functions
  generateTelegramLinkCode,
  getTelegramStatus,
  updateTelegramPreferences,
  disconnectTelegram
} = require('./database');
const { generateToken, authMiddleware, adminMiddleware } = require('./auth');
const fs = require('fs');
const path = require('path');
const notificationService = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sunucu çalışıyor!',
    timestamp: new Date().toISOString()
  });
});

// ==================== SUBSCRIPTION CATALOG ====================
const DEFAULT_CATALOG = require('./subscriptionCatalog');
const CATALOG_FILE = path.join(__dirname, 'subscriptionCatalog.json');

// Kataloğu dosyadan oku (yoksa varsayılanı kullan)
const loadCatalog = () => {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const data = fs.readFileSync(CATALOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Katalog dosyası okunamadı:', error.message);
  }
  return DEFAULT_CATALOG;
};

// Kataloğu dosyaya yaz
const saveCatalog = (catalog) => {
  try {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Katalog dosyası yazılamadı:', error.message);
    return false;
  }
};

// Mevcut katalog (bellekte)
let SUBSCRIPTION_CATALOG = loadCatalog();

// GET /api/subscription-catalog - Abonelik kataloğunu getir
app.get('/api/subscription-catalog', (req, res) => {
  res.json({
    success: true,
    data: SUBSCRIPTION_CATALOG
  });
});

// POST /api/admin/update-catalog - Kataloğu güncelle (Sadece Admin)
app.post('/api/admin/update-catalog', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { catalog } = req.body;

    if (!catalog || typeof catalog !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir katalog verisi gereklidir'
      });
    }

    // Kataloğu dosyaya kaydet
    if (saveCatalog(catalog)) {
      // Bellek içindeki kataloğu da güncelle
      SUBSCRIPTION_CATALOG = catalog;

      res.json({
        success: true,
        message: 'Katalog başarıyla güncellendi',
        data: SUBSCRIPTION_CATALOG
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Katalog dosyası kaydedilemedi'
      });
    }
  } catch (error) {
    console.error('Katalog güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Katalog güncellenirken bir hata oluştu'
    });
  }
});

// Root Endpoint - API Durum Kontrolü
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Gelir Gider Takip API Çalışıyor 🚀',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      expenses: '/api/expenses',
      categories: '/api/categories',
      subscriptions: '/api/subscriptions'
    }
  });
});

// GET /api/admin/test-telegram (Test Endpoint)
app.get('/api/admin/test-telegram', (req, res) => {
  try {
    const notifyTime = process.env.TELEGRAM_NOTIFY_TIME || '09:00';
    const message = `🔔 <b>Sistem Test Bildirimi</b>\n\n` +
      `✅ <b>Bağlantı Başarılı!</b>\n` +
      `📅 Günlük bildirim saati: <b>${notifyTime}</b> olarak ayarlı.\n\n` +
      `Sistem sorunsuz çalışıyor. 🚀`;

    notificationService.sendTelegramMessage(message);
    res.json({ success: true, message: 'Test mesajı gönderildi' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TELEGRAM API (User-specific) ====================

// POST /api/telegram/generate-code - Bağlantı kodu oluştur
app.post('/api/telegram/generate-code', authMiddleware, async (req, res) => {
  try {
    const result = await generateTelegramLinkCode(req.userId);
    res.json({
      success: true,
      data: {
        code: result.code,
        expires: result.expires,
        botUsername: 'FinansBot' // Bot username'inizi buraya yazın
      }
    });
  } catch (error) {
    console.error('Telegram kod oluşturma hatası:', error);
    res.status(500).json({ success: false, error: 'Kod oluşturulurken bir hata oluştu' });
  }
});

// GET /api/telegram/status - Bağlantı durumu ve tercihler
app.get('/api/telegram/status', authMiddleware, async (req, res) => {
  try {
    const status = await getTelegramStatus(req.userId);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Telegram durum hatası:', error);
    res.status(500).json({ success: false, error: 'Durum alınırken bir hata oluştu' });
  }
});

// PUT /api/telegram/preferences - Bildirim tercihlerini güncelle
app.put('/api/telegram/preferences', authMiddleware, async (req, res) => {
  try {
    const { subscriptions, goals, weeklySummary } = req.body;

    const result = await updateTelegramPreferences(req.userId, {
      subscriptions: subscriptions !== undefined ? subscriptions : true,
      goals: goals !== undefined ? goals : true,
      weeklySummary: weeklySummary !== undefined ? weeklySummary : false
    });

    res.json({
      success: true,
      message: 'Tercihler güncellendi',
      data: result
    });
  } catch (error) {
    console.error('Telegram tercih güncelleme hatası:', error);
    res.status(500).json({ success: false, error: 'Tercihler güncellenirken bir hata oluştu' });
  }
});

// DELETE /api/telegram/disconnect - Bağlantıyı kes
app.delete('/api/telegram/disconnect', authMiddleware, async (req, res) => {
  try {
    const result = await disconnectTelegram(req.userId);
    res.json({
      success: true,
      message: 'Telegram bağlantısı kesildi',
      data: result
    });
  } catch (error) {
    console.error('Telegram bağlantı kesme hatası:', error);
    res.status(500).json({ success: false, error: 'Bağlantı kesilirken bir hata oluştu' });
  }
});

// ==================== AUTH API ====================

// POST /api/auth/register - Kayıt ol
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validasyon
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı en az 3 karakter olmalıdır'
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir email adresi giriniz'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    const user = await createUser(username, email, password);
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user: { id: user.id, username: user.username, email: user.email },
        token
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Kayıt sırasında bir hata oluştu'
    });
  }
});

// POST /api/auth/login - Giriş yap
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email ve şifre gereklidir'
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email veya şifre hatalı'
      });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Email veya şifre hatalı'
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: { id: user.id, username: user.username, email: user.email },
        token
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş sırasında bir hata oluştu'
    });
  }
});

// GET /api/auth/me - Kullanıcı bilgisi
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Kullanıcı bilgisi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı bilgisi alınırken hata oluştu'
    });
  }
});

// ==================== CATEGORIES API ====================

// ==================== DASHBOARD API ====================

// GET /api/summary - Aylık özet (Gelir, Gider, Bakiye)
app.get('/api/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await getMonthlySummary(req.userId);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Özet bilgisi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Özet bilgisi alınırken bir hata oluştu'
    });
  }
});

// GET /api/expense-analysis - Pasta grafiği için kategori + abonelik verisi
app.get('/api/expense-analysis', authMiddleware, async (req, res) => {
  try {
    const analysis = await getExpenseAnalysis(req.userId);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Harcama analizi hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Harcama analizi alınırken bir hata oluştu'
    });
  }
});

// ==================== CATEGORIES API ====================

// GET /api/categories - Kategorileri listele (Auth required for custom categories)
app.get('/api/categories', authMiddleware, async (req, res) => {
  try {
    // req.userId authMiddleware'den geliyor
    const categories = await getAllCategories(req.userId);
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Kategori listeleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Kategoriler alınırken bir hata oluştu'
    });
  }
});

// POST /api/categories - Yeni kategori ekle
app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Kategori adı en az 2 karakter olmalıdır' });
    }

    if (!['Gelir', 'Gider'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Geçersiz kategori türü' });
    }

    const category = await addUserCategory(req.userId, name, type);
    res.status(201).json({
      success: true,
      message: 'Kategori eklendi',
      data: category
    });
  } catch (error) {
    console.error('Kategori ekleme hatası:', error);
    res.status(500).json({ success: false, error: 'Kategori eklenirken bir hata oluştu' });
  }
});

// PUT /api/categories/:id/budget - Kategori bütçe limiti güncelle
app.put('/api/categories/:id/budget', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { budget_limit } = req.body;

    if (budget_limit === undefined || budget_limit < 0) {
      return res.status(400).json({ success: false, error: 'Geçerli bir bütçe limiti giriniz' });
    }

    const result = await setCategoryBudget(req.userId, parseInt(id), parseFloat(budget_limit));

    if (result.updated) {
      res.json({ success: true, message: 'Bütçe limiti güncellendi', data: result });
    } else {
      res.status(404).json({ success: false, error: 'Kategori bulunamadı' });
    }
  } catch (error) {
    console.error('Bütçe güncelleme hatası:', error);
    res.status(500).json({ success: false, error: 'Bütçe güncellenirken bir hata oluştu' });
  }
});

// GET /api/budget-status - Bütçe durumunu getir
app.get('/api/budget-status', authMiddleware, async (req, res) => {
  try {
    const budgetStatus = await getBudgetStatus(req.userId);
    res.json({ success: true, data: budgetStatus });
  } catch (error) {
    console.error('Bütçe durumu hatası:', error);
    res.status(500).json({ success: false, error: 'Bütçe durumu alınırken bir hata oluştu' });
  }
});

// ==================== EXPENSES API (Protected) ====================

// GET /api/expenses - Kullanıcının harcamalarını getir
app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let expenses;

    if (startDate || endDate || (type && type !== 'all')) {
      expenses = await getFilteredExpenses(req.userId, startDate, endDate, type);
    } else {
      expenses = await getAllExpenses(req.userId);
    }

    res.json({
      success: true,
      data: expenses,
      count: expenses.length,
      filters: { startDate, endDate, type }
    });
  } catch (error) {
    console.error('Harcama listeleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Harcamalar alınırken bir hata oluştu'
    });
  }
});

// POST /api/expenses - Yeni harcama kaydet
app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { amount, description, date, category_id } = req.body;

    console.log('📥 POST /api/expenses - Gelen veri:', { userId: req.userId, amount, description, date, category_id });

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir tutar giriniz'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Tarih gereklidir'
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        error: 'Kategori seçimi gereklidir'
      });
    }

    const newExpense = await addExpense(req.userId, amount, description || '', date, category_id);

    console.log('✅ Harcama eklendi:', newExpense);

    res.status(201).json({
      success: true,
      message: 'Harcama başarıyla kaydedildi',
      data: newExpense
    });
  } catch (error) {
    console.error('❌ Harcama ekleme hatası:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Harcama kaydedilirken bir hata oluştu: ' + error.message
    });
  }
});

// DELETE /api/expenses/:id - Harcama sil
app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir ID gereklidir'
      });
    }

    const result = await deleteExpense(req.userId, parseInt(id));

    if (result.deleted) {
      res.json({
        success: true,
        message: 'Harcama başarıyla silindi',
        id: result.id
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Harcama bulunamadı veya yetkiniz yok'
      });
    }
  } catch (error) {
    console.error('Harcama silme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Harcama silinirken bir hata oluştu'
    });
  }
});

// Veritabanını başlat ve sunucuyu çalıştır
const startServer = async () => {
  try {
    await initializeDatabase();
    notificationService.initScheduledJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
      console.log('📍 API Endpoints:');
      console.log('   POST /api/auth/register - Kayıt');
      console.log('   POST /api/auth/login    - Giriş');
      console.log('   GET  /api/auth/me       - Kullanıcı bilgisi (Auth)');
      console.log('   GET  /api/categories    - Kategoriler');
      console.log('   GET  /api/expenses      - Harcamalar (Auth)');
      console.log('   POST /api/expenses      - Harcama ekle (Auth)');
      console.log('   DELETE /api/expenses/:id - Harcama sil (Auth)');
    });
  } catch (error) {
    console.error('❌ Sunucu başlatma hatası:', error);
    process.exit(1);
  }
};

// ==================== NOTES API (Protected) ====================

// GET /api/notes - Kullanıcının notlarını getir
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await getAllNotes(req.userId);
    res.json({
      success: true,
      data: notes,
      count: notes.length
    });
  } catch (error) {
    console.error('Not listeleme hatası:', error);
    res.status(500).json({ success: false, error: 'Notlar alınırken bir hata oluştu' });
  }
});

// POST /api/notes - Yeni not ekle
app.post('/api/notes', authMiddleware, async (req, res) => {
  try {
    const { title, content, due_date } = req.body;

    if (!title || title.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Başlık gerekli' });
    }

    // Tarih formatı doğrulaması
    let validatedDueDate = null;
    if (due_date) {
      const parsedDate = new Date(due_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Geçersiz tarih formatı' });
      }
      validatedDueDate = due_date;
    }

    const note = await addNote(req.userId, title.trim(), content?.trim() || '', validatedDueDate);
    res.status(201).json({
      success: true,
      message: 'Not eklendi',
      data: note
    });
  } catch (error) {
    console.error('Not ekleme hatası:', error);
    res.status(500).json({ success: false, error: 'Not eklenirken bir hata oluştu' });
  }
});

// PUT /api/notes/:id - Notu güncelle
app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_completed, due_date } = req.body;

    const result = await updateNote(req.userId, parseInt(id), { title, content, is_completed, due_date });

    if (result.updated) {
      res.json({ success: true, message: 'Not güncellendi' });
    } else {
      res.status(404).json({ success: false, error: 'Not bulunamadı veya güncelleme yapılmadı' });
    }
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    res.status(500).json({ success: false, error: 'Not güncellenirken bir hata oluştu' });
  }
});

// DELETE /api/notes/:id - Notu sil
app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteNote(req.userId, parseInt(id));

    if (result.deleted) {
      res.json({ success: true, message: 'Not silindi' });
    } else {
      res.status(404).json({ success: false, error: 'Not bulunamadı' });
    }
  } catch (error) {
    console.error('Not silme hatası:', error);
    res.status(500).json({ success: false, error: 'Not silinirken bir hata oluştu' });
  }
});

// ==================== SUBSCRIPTIONS API (Protected) ====================

// GET /api/subscriptions - Kullanıcının aboneliklerini getir
app.get('/api/subscriptions', authMiddleware, async (req, res) => {
  try {
    const subscriptions = await getAllSubscriptions(req.userId);
    res.json({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Abonelik listeleme hatası:', error);
    res.status(500).json({ success: false, error: 'Abonelikler alınırken bir hata oluştu' });
  }
});

// GET /api/subscriptions/pending - Bekleyen ödemeleri getir
app.get('/api/subscriptions/pending', authMiddleware, async (req, res) => {
  try {
    const pendingPayments = await getPendingPayments(req.userId);
    res.json({
      success: true,
      data: pendingPayments,
      count: pendingPayments.length
    });
  } catch (error) {
    console.error('Bekleyen ödemeler hatası:', error);
    res.status(500).json({ success: false, error: 'Bekleyen ödemeler alınırken bir hata oluştu' });
  }
});

// POST /api/subscriptions - Yeni abonelik ekle
app.post('/api/subscriptions', authMiddleware, async (req, res) => {
  try {
    const { name, amount, billing_day, category_id } = req.body;

    if (!name || name.trim().length < 1) {
      return res.status(400).json({ success: false, error: 'Abonelik adı gerekli' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Geçerli bir tutar giriniz' });
    }
    if (!billing_day || billing_day < 1 || billing_day > 31) {
      return res.status(400).json({ success: false, error: 'Ödeme günü 1-31 arasında olmalıdır' });
    }

    const subscription = await addSubscription(
      req.userId,
      name.trim(),
      parseFloat(amount),
      parseInt(billing_day),
      category_id ? parseInt(category_id) : null
    );

    res.status(201).json({
      success: true,
      message: 'Abonelik eklendi',
      data: subscription
    });
  } catch (error) {
    console.error('Abonelik ekleme hatası:', error);
    res.status(500).json({ success: false, error: 'Abonelik eklenirken bir hata oluştu' });
  }
});

// PUT /api/subscriptions/:id - Abonelik güncelle
app.put('/api/subscriptions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, name, billing_day, category_id } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Geçerli bir ID gereklidir' });
    }

    // En az bir alan güncellenecek mi kontrol et
    if (amount === undefined && name === undefined && billing_day === undefined && category_id === undefined) {
      return res.status(400).json({ success: false, error: 'Güncellenecek en az bir alan belirtmelisiniz' });
    }

    // Sayısal validasyon
    if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount) || amount <= 0)) {
      return res.status(400).json({ success: false, error: 'Tutar pozitif bir sayı olmalıdır' });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (name !== undefined) updateData.name = name.trim();
    if (billing_day !== undefined) updateData.billingDay = parseInt(billing_day);
    if (category_id !== undefined) updateData.categoryId = parseInt(category_id);

    const result = await updateSubscription(req.userId, parseInt(id), updateData);

    res.json({
      success: true,
      message: 'Abonelik güncellendi',
      data: result
    });
  } catch (error) {
    console.error('Abonelik güncelleme hatası:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Abonelik güncellenirken bir hata oluştu'
    });
  }
});

// DELETE /api/subscriptions/:id - Aboneliği iptal et
app.delete('/api/subscriptions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSubscription(req.userId, parseInt(id));

    if (result.deleted) {
      res.json({ success: true, message: 'Abonelik iptal edildi' });
    } else {
      res.status(404).json({ success: false, error: 'Abonelik bulunamadı' });
    }
  } catch (error) {
    console.error('Abonelik silme hatası:', error);
    res.status(500).json({ success: false, error: 'Abonelik silinirken bir hata oluştu' });
  }
});

startServer();
