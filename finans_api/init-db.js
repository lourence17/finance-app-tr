// init-db.js
// Bu script, veritabanı tablolarını oluşturmak için SADECE BİR KEZ çalıştırılacak.

const pool = require('./db'); // db.js'den bağlantı havuzumuzu alıyoruz

// Çalıştırılacak SQL sorgularının tamamı
const createTablesQuery = `
-- Tablolar zaten varsa, onları silerek temiz bir başlangıç yap
-- (Bu, geliştirme aşamasında kullanışlıdır)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. users Tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. categories Tablosu
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    -- user_id'si silinen kullanıcının kategorileri de silinsin (ON DELETE CASCADE)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    -- 'type' sütunu sadece 'gelir' veya 'gider' olabilir (CHECK kısıtlaması)
    type VARCHAR(10) NOT NULL CHECK (type IN ('gelir', 'gider')),
    
    -- Bir kullanıcı, aynı isim ve tipte iki kategori oluşturamasın
    UNIQUE(user_id, name, type)
);

-- 3. transactions (İşlemler) Tablosu
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL, -- Örn: 12345678.90
    description TEXT,
    transaction_date DATE NOT NULL, -- Sadece Tarih (Zaman değil)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Bu asenkron fonksiyonu çalıştırarak veritabanını başlat
const initializeDatabase = async () => {
  let client; // Bağlantı istemcisini tutmak için değişken
  try {
    // Havuzdan bir bağlantı (istemci) al
    client = await pool.connect(); 
    
    console.log('Veritabanına bağlanıldı, tablolar oluşturuluyor...');
    
    // SQL sorgularının tamamını çalıştır
    await client.query(createTablesQuery); 
    
    console.log('✅ Tablolar (users, categories, transactions) başarıyla oluşturuldu.');

  } catch (err) {
    // Bir hata olursa konsola yazdır
    console.error('❌ Tablo oluşturma hatası:', err.message);

  } finally {
    // İşlem bitince veya hata alınca,
    // istemciyi (client) havuza geri bırakmalıyız
    if (client) {
      client.release();
    }
    // Bu bir script olduğu için, işi bitince havuzu kapatabiliriz
    pool.end(); 
    console.log('Veritabanı bağlantısı havuzu (script için) kapatıldı.');
  }
};

// Fonksiyonu çağır
initializeDatabase();