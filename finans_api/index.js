// index.js (TAM VE GÜNCEL HALİ)

const express = require('express');
const pool = require('./db'); // 👈 './db' olduğundan emin olun (aynı dizin)
const cors = require('cors');
// 1. Express Uygulamasını Oluştur
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
// 2. JSON Middleware (app oluştuktan hemen sonra)
// Gelen isteklerin body kısmındaki JSON verilerini parse et
app.use(express.json());
// Bu satır, rota tanımlamalarından *önce* olmalıdır.
// 3. Rotaları (Routes) Yükle
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories'); 
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
// /api/users ile başlayan tüm istekleri userRoutes'a (routes/users.js) yönlendir
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);

// 4. Veritabanı Bağlantısını Test Etmek İçin Asenkron Fonksiyon
const checkDbConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Veritabanı bağlantısı başarılı! Zaman:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    process.exit(1);
  }
};

// 5. Temel bir "Route" (Yönlendirme)
// Ana URL'ye (http://localhost:3000/) gelen isteği karşılar
app.get('/', (req, res) => {
  res.json({ mesaj: "Kişisel Finans API'si çalışıyor!" });
});

// 6. Sunucuyu Başlat
// Önce veritabanı bağlantısını kontrol et,
// *sadece başarılıysa* sunucuyu dinlemeye başla.
checkDbConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
  });
});

// 7. Havuzdaki hataları yakalamak için (Genel hata yönetimi)
pool.on('error', (err, client) => {
  console.error('PostgreSQL Pool Hatası:', err);
});