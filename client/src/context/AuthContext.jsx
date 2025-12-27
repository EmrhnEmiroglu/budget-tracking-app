import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:5000/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Token varsa kullanıcı bilgisini al
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');

            if (storedToken) {
                try {
                    const response = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${storedToken}`
                        }
                    });
                    const data = await response.json();

                    if (data.success) {
                        setUser(data.data);
                        setToken(storedToken);
                    } else {
                        console.error('Token doğrulama başarısız:', data.error);
                        logout();
                    }
                } catch (error) {
                    console.error('Auth check error:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Kayıt ol
    const register = async (username, email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                setToken(data.data.token);
                setUser(data.data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Sunucuya bağlanılamadı' };
        }
    };

    // Giriş yap
    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.data.token);
                setToken(data.data.token);
                setUser(data.data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Sunucuya bağlanılamadı' };
        }
    };

    // Çıkış yap
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    // API istekleri için auth header - localStorage'dan direkt oku
    const authFetch = useCallback(async (url, options = {}) => {
        const storedToken = localStorage.getItem('token');

        if (!storedToken) {
            console.error('authFetch: Token bulunamadı!');
            throw new Error('Oturum süresi dolmuş');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
            ...options.headers,
        };

        console.log(`authFetch: ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, { ...options, headers });

        // 401 hatası varsa oturumu sonlandır
        if (response.status === 401) {
            console.error('authFetch: 401 Unauthorized - Oturum sonlandırılıyor');
            logout();
            throw new Error('Oturum süresi dolmuş');
        }

        // Diğer hata durumları için log
        if (!response.ok) {
            console.error(`authFetch: HTTP ${response.status} hatası`);
        }

        return response;
    }, [logout]);

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        register,
        login,
        logout,
        authFetch
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
