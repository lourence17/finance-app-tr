// db.js

const { Pool } = require('pg');
require('dotenv').config(); // .env dosyasını oku

// Veritabanı bağlantı havuzunu (Pool) oluştur
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Havuzda bir hata olursa konsola yazdır
pool.on('error', (err, client) => {
  console.error('PostgreSQL Pool Hatası:', err);
});

// Bu 'pool' objesini diğer dosyalarda kullanabilmek için dışa aktar
module.exports = pool;