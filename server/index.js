require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  initializeDatabase,
  getAllCategories,
  addExpense,
  getAllExpenses,
  getFilteredExpenses,
  deleteExpense,
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword
} = require('./database');
const { generateToken, authMiddleware } = require('./auth');

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

// GET /api/categories - Tüm kategorileri listele (public)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
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

    res.status(201).json({
      success: true,
      message: 'Harcama başarıyla kaydedildi',
      data: newExpense
    });
  } catch (error) {
    console.error('Harcama ekleme hatası:', error);
    res.status(500).json({
      success: false,
      error: 'Harcama kaydedilirken bir hata oluştu'
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

startServer();
