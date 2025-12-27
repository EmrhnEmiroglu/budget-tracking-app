const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gelir-gider-secret-key-2025';
const JWT_EXPIRES_IN = '7d';

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

module.exports = {
    JWT_SECRET,
    generateToken,
    verifyToken,
    authMiddleware
};
