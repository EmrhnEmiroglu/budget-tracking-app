require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Sunucu çalışıyor!',
    timestamp: new Date().toISOString()
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
