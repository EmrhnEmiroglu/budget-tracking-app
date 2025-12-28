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
          is_admin INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
                if (err) console.error('Users tablo hatası:', err.message);
                else {
                    // Migration: is_admin sütunu ekle (mevcut kullanıcılar için)
                    db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0", () => { });
                }
            });

            // Categories tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('Gider', 'Gelir')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
                if (err) console.error('Categories tablo hatası:', err.message);
                else {
                    // Migration: Mevcut tabloya user_id sütunu eklemeyi dene
                    db.run("ALTER TABLE categories ADD COLUMN user_id INTEGER", () => { });
                    // Migration: budget_limit sütunu ekle
                    db.run("ALTER TABLE categories ADD COLUMN budget_limit REAL DEFAULT 0", () => { });
                }
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

            // Notes tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          is_completed INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `, (err) => {
                if (err) console.error('Notes tablo hatası:', err.message);
                else {
                    // Migration: due_date sütunu ekle
                    db.run("ALTER TABLE notes ADD COLUMN due_date DATETIME", () => { });
                }
            });

            // Subscriptions tablosu
            db.run(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          billing_day INTEGER NOT NULL CHECK(billing_day >= 1 AND billing_day <= 31),
          category_id INTEGER,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `, (err) => {
                if (err) console.error('Subscriptions tablo hatası:', err.message);
                else {
                    // Migration: logo_url sütunu ekle
                    db.run("ALTER TABLE subscriptions ADD COLUMN logo_url TEXT", () => { });
                }
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
        const sql = `SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?`;
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

const getAllCategories = (userId) => {
    return new Promise((resolve, reject) => {
        // Sistem kategorileri (user_id IS NULL) + Kullanıcı kategorileri
        db.all('SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY type, name', [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const addUserCategory = (userId, name, type) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)';
        db.run(sql, [userId, name, type], function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, user_id: userId, name, type });
        });
    });
};

const getMonthlySummary = (userId) => {
    return new Promise((resolve, reject) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const summarySql = `
            SELECT 
                SUM(CASE WHEN c.type = 'Gelir' THEN e.amount ELSE 0 END) as total_income,
                SUM(CASE WHEN c.type = 'Gider' THEN e.amount ELSE 0 END) as total_expense
            FROM expenses e
            LEFT JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ? AND e.date BETWEEN ? AND ?
        `;

        db.get(summarySql, [userId, startOfMonth, endOfMonth], (err, summaryRow) => {
            if (err) return reject(err);

            // Aktif abonelikleri ve bu ayki harcamaları getir (Mükerrer eklemeyi önlemek için)
            const subSql = `SELECT name, amount FROM subscriptions WHERE user_id = ? AND is_active = 1`;
            const expSql = `SELECT description FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ?`;

            db.all(subSql, [userId], (err, subscriptions) => {
                if (err) return reject(err);

                db.all(expSql, [userId, startOfMonth, endOfMonth], (err, expenses) => {
                    if (err) return reject(err);

                    // Harcama açıklamalarını küçük harfe çevirip bir diziye al
                    const paidDescriptions = expenses.map(e => e.description ? e.description.toLowerCase() : '');

                    // Henüz ödenmemiş (harcamalara eklenmemiş) abonelikleri topla
                    let unpaidSubscriptionsTotal = 0;

                    subscriptions.forEach(sub => {
                        // Abonelik adı harcama açıklamasında geçiyor mu?
                        const isPaid = paidDescriptions.some(desc => desc.includes(sub.name.toLowerCase()));
                        if (!isPaid) {
                            unpaidSubscriptionsTotal += sub.amount;
                        }
                    });

                    const totalIncome = summaryRow?.total_income || 0;
                    const totalExpense = (summaryRow?.total_expense || 0) + unpaidSubscriptionsTotal;

                    resolve({
                        total_income: totalIncome,
                        total_expense: totalExpense,
                        balance: totalIncome - totalExpense
                    });
                });
            });
        });
    });
};

// Kategori bütçe limiti güncelle
const setCategoryBudget = (userId, categoryId, budgetLimit) => {
    return new Promise((resolve, reject) => {
        // Sadece kullanıcının erişebildiği kategorileri güncelle
        const sql = `UPDATE categories SET budget_limit = ? WHERE id = ? AND (user_id IS NULL OR user_id = ?)`;
        db.run(sql, [budgetLimit, categoryId, userId], function (err) {
            if (err) reject(err);
            else resolve({ updated: this.changes > 0, categoryId, budgetLimit });
        });
    });
};

// Bütçe durumu getir (kategori bazlı harcama vs limit)
const getBudgetStatus = (userId) => {
    return new Promise((resolve, reject) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const sql = `
            SELECT 
                c.id,
                c.name,
                c.type,
                COALESCE(c.budget_limit, 0) as budget_limit,
                COALESCE(SUM(e.amount), 0) as spent
            FROM categories c
            LEFT JOIN expenses e ON c.id = e.category_id 
                AND e.user_id = ? 
                AND e.date BETWEEN ? AND ?
            WHERE (c.user_id IS NULL OR c.user_id = ?) AND c.type = 'Gider'
            GROUP BY c.id
            ORDER BY c.name
        `;

        db.all(sql, [userId, startOfMonth, endOfMonth, userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => ({
                ...r,
                percentage: r.budget_limit > 0 ? Math.round((r.spent / r.budget_limit) * 100) : 0
            })));
        });
    });
};

// Harcama analizi (pie chart için kategori + abonelik)
const getExpenseAnalysis = (userId) => {
    return new Promise((resolve, reject) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Kategoriye göre harcamalar
        const categorySql = `
            SELECT 
                c.name as name,
                SUM(e.amount) as value
            FROM expenses e
            INNER JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ? AND e.date BETWEEN ? AND ? AND c.type = 'Gider'
            GROUP BY c.id
        `;

        // Aktif abonelikler
        const subSql = `SELECT SUM(amount) as total FROM subscriptions WHERE user_id = ? AND is_active = 1`;

        db.all(categorySql, [userId, startOfMonth, endOfMonth], (err, categoryRows) => {
            if (err) return reject(err);

            db.get(subSql, [userId], (err, subRow) => {
                if (err) return reject(err);

                let result = categoryRows || [];
                const subscriptionTotal = subRow?.total || 0;

                // Abonelikleri ayrı kategori olarak ekle
                if (subscriptionTotal > 0) {
                    result.push({ name: 'Abonelikler', value: subscriptionTotal });
                }

                resolve(result);
            });
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
// Filtrelenmiş harcamaları getir
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

        if (startDate && endDate) {
            sql += ` AND e.date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else {
            if (startDate) {
                sql += ` AND e.date >= ?`;
                params.push(startDate);
            }
            if (endDate) {
                sql += ` AND e.date <= ?`;
                params.push(endDate);
            }
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

// ==================== NOTES FUNCTIONS ====================

// Kullanıcının notlarını getir
const getAllNotes = (userId) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Not ekle
const addNote = (userId, title, content, dueDate = null) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO notes (user_id, title, content, due_date) VALUES (?, ?, ?, ?)';
        const dueDateValue = dueDate ? new Date(dueDate).toISOString() : null;
        db.run(sql, [userId, title, content || '', dueDateValue], function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, user_id: userId, title, content, is_completed: 0, due_date: dueDateValue });
        });
    });
};

// Not güncelle
const updateNote = (userId, noteId, data) => {
    return new Promise((resolve, reject) => {
        const fields = [];
        const values = [];

        if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
        if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
        if (data.is_completed !== undefined) { fields.push('is_completed = ?'); values.push(data.is_completed ? 1 : 0); }
        if (data.due_date !== undefined) {
            fields.push('due_date = ?');
            values.push(data.due_date ? new Date(data.due_date).toISOString() : null);
        }

        if (fields.length === 0) {
            return resolve({ updated: false });
        }

        values.push(noteId, userId);
        const sql = `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;

        db.run(sql, values, function (err) {
            if (err) reject(err);
            else resolve({ updated: this.changes > 0 });
        });
    });
};

// Not sil
const deleteNote = (userId, noteId) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [noteId, userId], function (err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes > 0 });
        });
    });
};

// ==================== SUBSCRIPTION FUNCTIONS ====================

// Kullanıcının aboneliklerini getir
const getAllSubscriptions = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT s.*, c.name as category_name 
            FROM subscriptions s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.user_id = ? AND s.is_active = 1
            ORDER BY s.billing_day ASC
        `;
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Abonelik ekle
const addSubscription = (userId, name, amount, billingDay, categoryId = null) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO subscriptions (user_id, name, amount, billing_day, category_id) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [userId, name, amount, billingDay, categoryId], function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, user_id: userId, name, amount, billing_day: billingDay, category_id: categoryId, is_active: 1 });
        });
    });
};

// Abonelik güncelle (sadece kullanıcının kendi aboneliği)
const updateSubscription = (userId, subscriptionId, data) => {
    return new Promise((resolve, reject) => {
        const { amount, name, billingDay, categoryId } = data;

        // Dinamik SQL oluştur (sadece gelen alanları güncelle)
        const updates = [];
        const params = [];

        if (amount !== undefined) {
            if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
                return reject(new Error('Tutar sayısal ve pozitif bir değer olmalıdır'));
            }
            updates.push('amount = ?');
            params.push(amount);
        }
        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (billingDay !== undefined) {
            if (billingDay < 1 || billingDay > 31) {
                return reject(new Error('Ödeme günü 1-31 arasında olmalıdır'));
            }
            updates.push('billing_day = ?');
            params.push(billingDay);
        }
        if (categoryId !== undefined) {
            updates.push('category_id = ?');
            params.push(categoryId);
        }

        if (updates.length === 0) {
            return reject(new Error('Güncellenecek alan belirtilmedi'));
        }

        params.push(subscriptionId, userId);

        const sql = `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ? AND user_id = ? AND is_active = 1`;

        db.run(sql, params, function (err) {
            if (err) reject(err);
            else if (this.changes === 0) reject(new Error('Abonelik bulunamadı veya yetkiniz yok'));
            else resolve({ updated: true, id: subscriptionId });
        });
    });
};

// Abonelik sil/deaktif et
const deleteSubscription = (userId, subscriptionId) => {
    return new Promise((resolve, reject) => {
        db.run('UPDATE subscriptions SET is_active = 0 WHERE id = ? AND user_id = ?', [subscriptionId, userId], function (err) {
            if (err) reject(err);
            else resolve({ deleted: this.changes > 0 });
        });
    });
};

// Bu ay bekleyen ödemeleri getir
const getPendingPayments = (userId) => {
    return new Promise((resolve, reject) => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();

        // Aktif abonelikleri getir
        const subscriptionsSql = `
            SELECT s.*, c.name as category_name 
            FROM subscriptions s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.user_id = ? AND s.is_active = 1
        `;

        db.all(subscriptionsSql, [userId], (err, subscriptions) => {
            if (err) return reject(err);

            // Bu ay yapılan ödemeleri kontrol et
            const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
            const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

            const expensesSql = `
                SELECT DISTINCT description FROM expenses 
                WHERE user_id = ? AND date BETWEEN ? AND ?
            `;

            db.all(expensesSql, [userId, startOfMonth, endOfMonth], (err, expenses) => {
                if (err) return reject(err);

                const paidDescriptions = expenses.map(e => e.description);

                const pendingPayments = subscriptions.map(sub => {
                    const isPaid = paidDescriptions.some(desc => desc && desc.includes(sub.name));
                    const dueDate = new Date(currentYear, currentMonth - 1, sub.billing_day);
                    const isOverdue = currentDay > sub.billing_day && !isPaid;
                    const isDueToday = currentDay === sub.billing_day && !isPaid;

                    return {
                        ...sub,
                        is_paid: isPaid,
                        is_overdue: isOverdue,
                        is_due_today: isDueToday,
                        due_date: dueDate.toISOString().split('T')[0]
                    };
                }).filter(p => !p.is_paid);

                resolve(pendingPayments);
            });
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
    addUserCategory,
    setCategoryBudget,
    getBudgetStatus,
    // Expense functions
    addExpense,
    getAllExpenses,
    getFilteredExpenses,
    deleteExpense,
    // Notes functions
    getAllNotes,
    addNote,
    updateNote,
    deleteNote,
    // Subscription functions
    getAllSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    getPendingPayments,
    // Summary
    getMonthlySummary,
    getExpenseAnalysis,
    closeDatabase
};
