const nodemailer = require('nodemailer');

// Gmail SMTP transporter — kimlik bilgileri .env'den okunur.
// EMAIL_USER: gönderen Gmail adresi
// EMAIL_PASS: Gmail "uygulama şifresi" (normal şifre değil, 16 haneli app password)
let transporter = null;

const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null; // Yapılandırma yoksa e-posta gönderilemez (çökmez, uyarılır)
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
        });
    }
    return transporter;
};

// 6 haneli rasgele doğrulama kodu üret
const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Doğrulama e-postası gönder.
// purpose: 'register' (kayıt doğrulama) | 'reset' (şifre sıfırlama)
const sendVerificationEmail = async (toEmail, code, purpose = 'register') => {
    const tx = getTransporter();

    // Geliştirme kolaylığı: yapılandırma yoksa kodu konsola yaz, çökmeden devam et.
    if (!tx) {
        console.warn(`⚠️ EMAIL_USER/EMAIL_PASS eksik — e-posta gönderilemedi. ${toEmail} için kod: ${code}`);
        return { sent: false, devCode: code };
    }

    const isReset = purpose === 'reset';
    const title = isReset ? 'Şifre Sıfırlama Kodu' : 'E-posta Doğrulama Kodu';
    const intro = isReset
        ? 'Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanın.'
        : 'Hesabınızı doğrulamak için aşağıdaki kodu uygulamaya girin.';

    const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a2e;">
      <div style="text-align:center; margin-bottom: 24px;">
        <div style="display:inline-block; width:48px; height:48px; line-height:48px; border-radius:12px; background:#6C63FF; color:#fff; font-size:24px; font-weight:bold;">₺</div>
        <h2 style="margin:12px 0 0; font-size:18px;">Bütçe Takip Sistemi</h2>
      </div>
      <h3 style="font-size:16px; margin-bottom:8px;">${title}</h3>
      <p style="font-size:14px; color:#444; line-height:1.5;">${intro}</p>
      <div style="text-align:center; margin:28px 0;">
        <div style="display:inline-block; font-size:34px; letter-spacing:10px; font-weight:bold; color:#6C63FF; background:#f1f0ff; padding:16px 28px; border-radius:12px;">${code}</div>
      </div>
      <p style="font-size:13px; color:#888; line-height:1.5;">Bu kod <b>10 dakika</b> boyunca geçerlidir. Bu işlemi siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
      <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
      <p style="font-size:11px; color:#aaa; text-align:center;">Bu otomatik bir e-postadır, lütfen yanıtlamayınız.</p>
    </div>`;

    try {
        await tx.sendMail({
            from: `"Bütçe Takip" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `${title}: ${code}`,
            html,
        });
        return { sent: true };
    } catch (error) {
        console.error('E-posta gönderme hatası:', error.message);
        return { sent: false, error: error.message };
    }
};

module.exports = {
    generateCode,
    sendVerificationEmail,
};
