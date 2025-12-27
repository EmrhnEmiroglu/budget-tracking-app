const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

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
            // Users tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
                if (err) console.error('Users tablo hatası:', err.message);
            });

            // Categories tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('Gider', 'Gelir')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, type)
        )
      `, (err) => {
                if (err) console.error('Categories tablo hatası:', err.message);
            });

            // Expenses tablosu (user_id ile)
            db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          category_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
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
                { name: 'Ulaşım', type: 'Gider' },
                { name: 'Sağlık', type: 'Gider' },
                { name: 'Giyim', type: 'Gider' },
                { name: 'Maaş', type: 'Gelir' },
                { name: 'Ek Gelir', type: 'Gelir' }
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

// ==================== USER FUNCTIONS ====================

// Kullanıcı oluştur
const createUser = async (username, email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;

            db.run(sql, [username, email, hashedPassword], function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint')) {
                        reject(new Error('Bu kullanıcı adı veya email zaten kullanılıyor'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve({ id: this.lastID, username, email });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Kullanıcı bul (email ile)
const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.get(sql, [email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Kullanıcı bul (ID ile)
const findUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id, username, email, created_at FROM users WHERE id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Şifre doğrula
const verifyPassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

// ==================== CATEGORY FUNCTIONS ====================

const getAllCategories = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM categories ORDER BY type, name', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// ==================== EXPENSE FUNCTIONS ====================

// Kullanıcının tüm harcamalarını getir
const getAllExpenses = (userId) => {
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
      WHERE e.user_id = ?
      ORDER BY e.date DESC, e.created_at DESC
    `;
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Filtrelenmiş harcamaları getir (user_id + tarih aralığı + tür filtresi)
const getFilteredExpenses = (userId, startDate, endDate, type) => {
    return new Promise((resolve, reject) => {
        let sql = `
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
      WHERE e.user_id = ?
    `;
        const params = [userId];

        if (startDate) {
            sql += ` AND e.date >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            sql += ` AND e.date <= ?`;
            params.push(endDate);
        }
        if (type && type !== 'all') {
            sql += ` AND c.type = ?`;
            params.push(type);
        }

        sql += ` ORDER BY e.date DESC, e.created_at DESC`;

        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Yeni harcama ekle (user_id ile)
const addExpense = (userId, amount, description, date, category_id) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO expenses (user_id, amount, description, date, category_id) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [userId, amount, description, date, category_id], function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, user_id: userId, amount, description, date, category_id });
        });
    });
};

// Harcama sil (user_id kontrolü ile)
const deleteExpense = (userId, id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM expenses WHERE id = ? AND user_id = ?`;
        db.run(sql, [id, userId], function (err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes > 0, id });
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

module.exports = {
    db,
    initializeDatabase,
    // User functions
    createUser,
    findUserByEmail,
    findUserById,
    verifyPassword,
    // Category functions
    getAllCategories,
    // Expense functions
    addExpense,
    getAllExpenses,
    getFilteredExpenses,
    deleteExpense,
    closeDatabase
};
