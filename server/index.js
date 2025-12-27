require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase, getAllCategories, addExpense, getAllExpenses, getFilteredExpenses, deleteExpense } = require('./database');

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

// ==================== CATEGORIES API ====================

// GET /api/categories - Tüm kategorileri listele
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

// ==================== EXPENSES API ====================

// GET /api/expenses - Harcamaları getir (opsiyonel filtrelerle)
app.get('/api/expenses', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let expenses;

    // Eğer filtre parametreleri varsa filtrelenmiş sonuç getir
    if (startDate || endDate || (type && type !== 'all')) {
      expenses = await getFilteredExpenses(startDate, endDate, type);
    } else {
      expenses = await getAllExpenses();
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

// POST /api/expenses - Yeni bir harcama kaydet
app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, description, date, category_id } = req.body;

    // Validasyon
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

    const newExpense = await addExpense(amount, description || '', date, category_id);

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
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir ID gereklidir'
      });
    }

    const result = await deleteExpense(parseInt(id));

    if (result.deleted) {
      res.json({
        success: true,
        message: 'Harcama başarıyla silindi',
        id: result.id
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Harcama bulunamadı'
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
      console.log('📍 Mevcut API Endpoints:');
      console.log('   GET  /api/health     - Sunucu durumu');
      console.log('   GET  /api/categories - Kategori listesi');
      console.log('   GET  /api/expenses   - Harcama listesi (query: startDate, endDate, type)');
      console.log('   POST /api/expenses   - Yeni harcama ekle');
      console.log('   DELETE /api/expenses/:id - Harcama sil');
    });
  } catch (error) {
    console.error('❌ Sunucu başlatma hatası:', error);
    process.exit(1);
  }
};

startServer();
