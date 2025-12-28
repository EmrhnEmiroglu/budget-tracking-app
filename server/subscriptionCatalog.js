/**
 * SUBSCRIPTION CATALOG CONFIG
 * 
 * Merkezi abonelik kataloğu yapılandırması.
 * Fiyatları güncellemek için bu dosyayı düzenleyin.
 * 
 * Son Güncelleme: Aralık 2025
 */

const SUBSCRIPTION_CATALOG = {
    netflix: {
        name: 'Netflix',
        domain: 'netflix.com',
        brandColor: '#E50914',
        logoUrls: [
            'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png',
            'https://logo.clearbit.com/netflix.com',
            'https://www.netflix.com/favicon.ico'
        ],
        icon: '🎬',
        plans: [
            { id: 'netflix_basic', name: 'Temel', amount: 189.99 },
            { id: 'netflix_standard', name: 'Standart', amount: 289.99 },
            { id: 'netflix_premium', name: 'Özel', amount: 379.99 }
        ]
    },
    spotify: {
        name: 'Spotify',
        domain: 'spotify.com',
        brandColor: '#1DB954',
        logoUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg',
            'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
            'https://logo.clearbit.com/spotify.com'
        ],
        icon: '🎵',
        plans: [
            { id: 'spotify_individual', name: 'Bireysel', amount: 139.99 },
            { id: 'spotify_student', name: 'Öğrenci', amount: 69.99 },
            { id: 'spotify_family', name: 'Aile', amount: 209.99 }
        ]
    },
    youtube: {
        name: 'YouTube Premium',
        domain: 'youtube.com',
        brandColor: '#FF0000',
        logoUrls: [
            'https://logo.clearbit.com/youtube.com',
            'https://www.youtube.com/favicon.ico'
        ],
        icon: '▶️',
        plans: [
            { id: 'youtube_individual', name: 'Bireysel', amount: 79.99 },
            { id: 'youtube_family', name: 'Aile', amount: 159.99 },
            { id: 'youtube_student', name: 'Öğrenci', amount: 52.99 }
        ]
    },
    disney: {
        name: 'Disney+',
        domain: 'disneyplus.com',
        brandColor: '#0063E5',
        logoUrls: [
            'https://logo.clearbit.com/disneyplus.com',
            'https://www.disneyplus.com/favicon.ico'
        ],
        icon: '✨',
        plans: [
            { id: 'disney_ads', name: 'Reklamlı', amount: 249.90 },
            { id: 'disney_premium', name: 'Reklamsız', amount: 449.90 }
        ]
    },
    amazon: {
        name: 'Amazon Prime',
        domain: 'amazon.com.tr',
        brandColor: '#00A8E1',
        logoUrls: [
            'https://logo.clearbit.com/amazon.com',
            'https://www.amazon.com/favicon.ico'
        ],
        icon: '📦',
        plans: [
            { id: 'amazon_standard', name: 'Standart', amount: 69.90 }
        ]
    }
};

module.exports = SUBSCRIPTION_CATALOG;
