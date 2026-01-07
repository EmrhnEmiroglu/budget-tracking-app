const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
// db objesini ve diğer fonksiyonları import et
const {
    db,
    getMonthlySummary,
    getExpenseAnalysis,
    linkTelegramAccount
} = require('../database');

let bot = null;

// Admin User ID bulmak için yardımcı fonksiyon
const getAdminUserId = () => {
    return new Promise((resolve, reject) => {
        // is_admin olan ilk kullanıcıyı al (veya ID 1)
        db.get('SELECT id FROM users WHERE is_admin = 1 LIMIT 1', (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.id : 1);
        });
    });
};

const sendTelegramMessage = (message) => {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!bot || !chatId) {
        console.warn('Bot başlatılmadı veya Chat ID eksik! Bildirim gönderilemedi.');
        return;
    }
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
};

const checkDailyReminders = async () => {
    console.log('📅 Günlük bildirim kontrolü çalışıyor...');

    const today = new Date();
    const dayOfMonth = today.getDate();
    const dateStr = today.toISOString().split('T')[0];

    // 1. Abonelik Kontrolü
    try {
        const sql = `SELECT name, amount FROM subscriptions WHERE billing_day = ?`;
        db.all(sql, [dayOfMonth], (err, rows) => {
            if (err) {
                console.error('Abonelik sorgu hatası:', err);
                return;
            }
            if (rows && rows.length > 0) {
                rows.forEach(sub => {
                    const message = `💰 <b>Ödeme Hatırlatıcı</b>\n\nBugün <b>${sub.name}</b> ödemen var!\nTutar: <b>₺${sub.amount.toFixed(2)}</b>`;
                    sendTelegramMessage(message);
                });
            }
        });
    } catch (e) {
        console.error('Abonelik kontrol hatası:', e);
    }

    // 2. Hedef Kontrolü
    try {
        const sql = `SELECT title, target_amount, current_amount FROM notes WHERE type = 'goal' AND deadline = ?`;
        db.all(sql, [dateStr], (err, rows) => {
            if (err) {
                console.error('Hedef sorgu hatası:', err);
                return;
            }
            if (rows && rows.length > 0) {
                rows.forEach(goal => {
                    const message = `🎯 <b>Hedef Hatırlatıcı</b>\n\n"<b>${goal.title}</b>" hedefinin son günü geldi!\nDurum: ₺${goal.current_amount} / ₺${goal.target_amount}`;
                    sendTelegramMessage(message);
                });
            }
        });
    } catch (e) {
        console.error('Hedef kontrol hatası:', e);
    }
};

const initScheduledJobs = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

    if (!token) {
        console.error('❌ TELEGRAM_BOT_TOKEN eksik, bot başlatılamadı.');
        return;
    }

    if (bot) {
        console.log('⚠️ Bot zaten çalışıyor, yeniden başlatılmadı.');
        return;
    }

    // Botu Polling modunda başlat
    bot = new TelegramBot(token, { polling: true });

    // Hata dinleyicisi (Polling hatalarını yakalamak için)
    bot.on('polling_error', (error) => {
        console.error('Telegram Polling Hatası:', error.code, error.message);
    });

    console.log('🤖 Telegram Botu başlatıldı ve dinlemeye geçti...');

    // Kullanıcının chat ID'sine göre user ID bul
    const getUserByChatId = (chatId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT id, username FROM users WHERE telegram_chat_id = ?', [chatId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    };

    // Mesaj dinleyici
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id.toString();
        const text = msg.text;

        if (!text) return;

        // /baglan Komutu - Herkes kullanabilir
        if (text.startsWith('/baglan')) {
            const parts = text.split(' ');
            if (parts.length < 2) {
                bot.sendMessage(chatId, '❌ Kullanım: /baglan <kod>\n\nÖrnek: /baglan ABC123');
                return;
            }

            const code = parts[1].trim();
            try {
                const result = await linkTelegramAccount(code, chatId);
                if (result.success) {
                    bot.sendMessage(chatId,
                        `✅ <b>Bağlantı Başarılı!</b>\n\n` +
                        `Merhaba <b>${result.username}</b>! 👋\n\n` +
                        `Artık Telegram üzerinden bildirim alabilirsin.\n\n` +
                        `📌 <b>Kullanabileceğin komutlar:</b>\n` +
                        `/bakiye - Mevcut bakiye durumu\n` +
                        `/ozet - Bu ayın harcama özeti`,
                        { parse_mode: 'HTML' }
                    );
                } else {
                    bot.sendMessage(chatId, `❌ ${result.error}`);
                }
            } catch (error) {
                console.error('/baglan hatası:', error);
                bot.sendMessage(chatId, '❌ Bağlantı kurulurken bir hata oluştu.');
            }
            return;
        }

        // Diğer komutlar için kullanıcı doğrulaması
        const user = await getUserByChatId(chatId);
        if (!user) {
            bot.sendMessage(chatId,
                '🔒 Bu komutu kullanmak için önce hesabını bağlamalısın.\n\n' +
                '1️⃣ Finans uygulamasına giriş yap\n' +
                '2️⃣ Sağ üstteki Telegram ikonuna tıkla\n' +
                '3️⃣ Gösterilen kodu buraya yaz: /baglan <kod>'
            );
            return;
        }

        // /bakiye Komutu
        if (text === '/bakiye') {
            try {
                const summary = await getMonthlySummary(user.id);

                const message = `💰 <b>Mevcut Durum:</b>\n\n` +
                    `💵 <b>Net Bakiye:</b> ₺${summary.balance.toFixed(2)}\n` +
                    `📥 <b>Toplam Gelir:</b> ₺${summary.total_income.toFixed(2)}\n` +
                    `📤 <b>Toplam Gider:</b> ₺${summary.total_expense.toFixed(2)}`;

                bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            } catch (error) {
                console.error('/bakiye hatası:', error);
                bot.sendMessage(chatId, '❌ Verilere şu an ulaşamıyorum, lütfen sonra tekrar dene.');
            }
        }

        // /ozet Komutu
        else if (text === '/ozet') {
            try {
                const analysis = await getExpenseAnalysis(user.id);

                if (!analysis || analysis.length === 0) {
                    bot.sendMessage(chatId, '📊 Bu ay henüz harcama verisi bulunmuyor.');
                    return;
                }

                let message = `📊 <b>Bu Ayın Özeti:</b>\n\n`;
                analysis.forEach(item => {
                    // Kategoriye göre basit emoji seçimi (isimden tahmin)
                    let emoji = '🏷️';
                    const nameLower = item.name.toLowerCase();
                    if (nameLower.includes('fatura')) emoji = '⚡';
                    else if (nameLower.includes('ulaşım') || nameLower.includes('yakıt')) emoji = '🚗';
                    else if (nameLower.includes('market')) emoji = '🛒';
                    else if (nameLower.includes('yemek') || nameLower.includes('restoran')) emoji = '🍔';
                    else if (nameLower.includes('kira')) emoji = '🏠';
                    else if (nameLower.includes('abonelik')) emoji = '📺';
                    else if (nameLower.includes('eğlence')) emoji = '🎉';
                    else if (nameLower.includes('eğitim')) emoji = '📚';
                    else if (nameLower.includes('sağlık')) emoji = '💊';

                    message += `${emoji} <b>${item.name}:</b> ₺${item.value.toFixed(2)}\n`;
                });

                bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            } catch (error) {
                console.error('/ozet hatası:', error);
                bot.sendMessage(chatId, '❌ Verilere şu an ulaşamıyorum, lütfen sonra tekrar dene.');
            }
        }

        // /start Komutu
        else if (text === '/start') {
            bot.sendMessage(chatId,
                `👋 <b>Finans Bot'a Hoşgeldin!</b>\n\n` +
                `Bu bot ile harcamalarını takip edebilirsin.\n\n` +
                `🔗 Önce hesabını bağla:\n` +
                `1️⃣ Finans uygulamasına giriş yap\n` +
                `2️⃣ Sağ üstteki Telegram ikonuna tıkla\n` +
                `3️⃣ Gösterilen kodu buraya yaz: /baglan <kod>`,
                { parse_mode: 'HTML' }
            );
        }
    });

    // Cron Job
    const notifyTime = process.env.TELEGRAM_NOTIFY_TIME || '09:00';
    const [hour, minute] = notifyTime.split(':');
    const cronSchedule = `${parseInt(minute || 0)} ${parseInt(hour || 9)} * * *`;

    cron.schedule(cronSchedule, () => {
        checkDailyReminders();
    }, {
        timezone: "Europe/Istanbul"
    });

    console.log(`✅ Telegram bildirim zamanlayıcısı kuruldu (Her gün ${notifyTime})`);
};

module.exports = {
    initScheduledJobs,
    sendTelegramMessage,
    checkDailyReminders
};
