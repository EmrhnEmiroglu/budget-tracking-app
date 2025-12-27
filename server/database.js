const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosya yolu
const dbPath = path.join(__dirname, 'database.sqlite');

// Veritabanı bağlantısı
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('✅ SQLite veritabanına bağlandı');
    }
});

// Tabloları oluştur
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Categories tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL CHECK(type IN ('Gider', 'Gelir')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
                if (err) console.error('Categories tablo hatası:', err.message);
            });

            // Expenses tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          category_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `, (err) => {
                if (err) console.error('Expenses tablo hatası:', err.message);
            });

            // Seed data - Başlangıç kategorileri
            const seedCategories = [
                { name: 'Market', type: 'Gider' },
                { name: 'Fatura', type: 'Gider' },
                { name: 'Eğlence', type: 'Gider' },
                { name: 'Maaş', type: 'Gelir' }
            ];

            const insertSeed = db.prepare(`
        INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)
      `);

            seedCategories.forEach(category => {
                insertSeed.run(category.name, category.type);
            });

            insertSeed.finalize((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Veritabanı tabloları ve başlangıç verileri hazır');
                    resolve();
                }
            });
        });
    });
};

// Tüm kategorileri getir
const getAllCategories = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM categories ORDER BY type, name', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Yeni harcama ekle
const addExpense = (amount, description, date, category_id) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO expenses (amount, description, date, category_id) VALUES (?, ?, ?, ?)`;
        db.run(sql, [amount, description, date, category_id], function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, amount, description, date, category_id });
        });
    });
};

// Tüm harcamaları getir (kategori bilgisiyle birlikte)
const getAllExpenses = () => {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT 
        e.id,
        e.amount,
        e.description,
        e.date,
        e.category_id,
        e.created_at,
        c.name as category_name,
        c.type as category_type
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      ORDER BY e.date DESC, e.created_at DESC
    `;
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Veritabanı bağlantısını kapat
const closeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Harcama sil
const deleteExpense = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM expenses WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes > 0, id });
        });
    });
};

module.exports = {
    db,
    initializeDatabase,
    getAllCategories,
    addExpense,
    getAllExpenses,
    deleteExpense,
    closeDatabase
};
