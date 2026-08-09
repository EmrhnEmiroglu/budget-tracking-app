const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- Kayıtlı Kullanıcılar ---');
db.all('SELECT username, email FROM users', [], (err, rows) => {
    if (err) {
        console.error('Hata:', err.message);
        return;
    }
    if (rows.length === 0) {
        console.log('Henüz kullanıcı kaydı bulunamadı.');
    } else {
        rows.forEach((row, index) => {
            console.log(`${index + 1}. Kullanıcı Adı: ${row.username}, Email: ${row.email}`);
        });
    }
    db.close();
});
