const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const email = 'ornek@gmail.com';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    // Önce kullanıcıyı kontrol et
    db.get('SELECT id, username, email, is_admin FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('❌ Sorgu hatası:', err.message);
            db.close();
            process.exit(1);
        }

        if (!row) {
            console.error(`❌ Hata: '${email}' adresine sahip bir kullanıcı bulunamadı.`);
            db.close();
            process.exit(1);
        }

        console.log(`👤 Kullanıcı bulundu: ${row.username} (ID: ${row.id})`);
        console.log(`Mevcut yetki: ${row.is_admin === 1 ? 'Admin' : 'Normal Kullanıcı'}`);

        // Admin yetkisi ver
        db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [email], function(err) {
            if (err) {
                console.error('❌ Güncelleme hatası:', err.message);
            } else {
                console.log(`✅ Başarılı! '${email}' artık Admin yetkisine sahip.`);
            }
            db.close();
        });
    });
});
