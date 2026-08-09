const jwt = require('jsonwebtoken');
const { findUserById } = require('./database');

// JWT imzalama anahtarı yalnızca .env'den okunur.
// Koda gömülü bir yedek değer BİLEREK yoktur: kaynak kodu herkese açık olduğu
// için gömülü anahtar, herkesin geçerli token üretebilmesi anlamına gelirdi.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
    console.error('\n❌ JWT_SECRET tanımlı değil.\n');
    console.error('   server/.env.example dosyasını server/.env olarak kopyalayın');
    console.error('   ve JWT_SECRET satırına rastgele bir değer yazın. Üretmek için:\n');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
}

// JWT Token oluştur
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// JWT Token doğrula
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Auth Middleware - Protected routes için
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Yetkilendirme token\'ı gereklidir'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Geçersiz veya süresi dolmuş token'
            });
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Auth middleware hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Kimlik doğrulama hatası'
        });
    }
};

// Admin Middleware - Sadece admin kullanıcılar için
const adminMiddleware = async (req, res, next) => {
    try {
        // authMiddleware'den gelen userId'yi kullan
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Kimlik doğrulama gerekli'
            });
        }

        const user = await findUserById(req.userId);

        if (!user || !user.is_admin) {
            return res.status(403).json({
                success: false,
                error: 'Bu işlem için admin yetkisi gereklidir'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Yetki kontrolü sırasında bir hata oluştu'
        });
    }
};

module.exports = {
    JWT_SECRET,
    generateToken,
    verifyToken,
    authMiddleware,
    adminMiddleware
};
