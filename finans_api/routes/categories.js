// routes/categories.js

const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware'); // 👈 Bizim "Güvenlik Görevlimiz"

const router = express.Router();

// ÖNEMLİ NOT:
// Bu dosyaya giren TÜM rotaların korunmasını istiyoruz.
// 'authMiddleware'i her rotaya (router.post, router.get) tek tek eklemek yerine,
// bu router'ı kullanan HER İSTEĞİN önce bu middleware'den geçmesini
// en başta belirtebiliriz.
router.use(authMiddleware);

// --- Buradan sonraki tüm endpoint'ler KORUMALIDIR ---
// (Yani, geçerli bir Bearer Token olmadan erişilemezler)


// POST /api/categories - Yeni bir kategori oluştur
router.post('/', async (req, res) => {
  try {
    // 1. Gelen veriyi (name, type) ve token'dan user_id'yi al
    const { name, type } = req.body;
    // req.user.id, 'authMiddleware' sayesinde bize geliyor
    const userId = req.user.id; 

    // 2. Doğrulama
    if (!name || !type) {
      return res.status(400).json({ hata: 'Kategori adı (name) ve tipi (type) zorunludur.' });
    }
    if (type !== 'gelir' && type !== 'gider') {
      return res.status(400).json({ hata: "Tip, 'gelir' veya 'gider' olmalıdır." });
    }

    // 3. Veritabanına Ekle
    // (user_id, name, type) için UNIQUE kısıtlamamız olduğunu unutmayın
    const newCategory = await pool.query(
      'INSERT INTO categories (user_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, type]
    );

    // 4. Başarılı yanıtı döndür
    res.status(201).json(newCategory.rows[0]);

  } catch (err) {
    // Veritabanı 'unique constraint' (hata kodu 23505) hatası verirse
    if (err.code === '23505') {
      return res.status(400).json({ hata: 'Bu isim ve tipte bir kategori zaten mevcut.' });
    }
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});


// GET /api/categories - Giriş yapmış kullanıcının TÜM kategorilerini listele
router.get('/', async (req, res) => {
  try {
    // Sadece token'ı gönderen kullanıcıya (req.user.id) ait kategorileri getir
    const allCategories = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id] // 👈 Güvenlik: Sadece kendi verisini görmesini sağlar
    );

    // Sonucu (boş bir dizi olsa bile) döndür
    res.status(200).json(allCategories.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// routes/categories.js (module.exports'un üstüne ekleyin)

// DELETE /api/categories/:id - Bir kategoriyi ID'ye göre sil
// :id kısmı dinamiktir (örn: /api/categories/1 veya /api/categories/15)
router.delete('/:id', async (req, res) => {
  try {
    // 1. Silinecek kategorinin ID'sini URL'den al
    // (req.params, URL'deki :id, :slug gibi değişkenleri tutar)
    const categoryId = req.params.id; 
    // Token'dan kullanıcı ID'sini al
    const userId = req.user.id; 

    // 2. Güvenlik Kontrolü:
    // Kullanıcının, silmeye çalıştığı kategorinin (categoryId)
    // gerçekten sahibi (user_id) olup olmadığını kontrol et.
    const categoryCheck = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    if (categoryCheck.rows.length === 0) {
      // 403 Forbidden (Yasaklanmış) veya 404 Not Found (Bulunamadı)
      // Kategori yok VEYA kategori başkasına ait.
      return res.status(404).json({ hata: 'Kategori bulunamadı veya bu kategori üzerinde işlem yapma yetkiniz yok.' });
    }

    // 3. Silme İşlemi
    // (NOT: Veritabanını 'ON DELETE CASCADE' olarak kurduğumuz için,
    // bu kategoriyi silmek, bu kategoriye bağlı TÜM İŞLEMLERİ (transactions)
    // OTOMATİK OLARAK SİLECEKTİR. Bu, orta seviye projeler için istenen bir şeydir!)
    await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    // 4. Başarılı yanıt
    // 200 OK (veya 204 No Content)
    res.status(200).json({ mesaj: 'Kategori ve bu kategoriye bağlı tüm işlemler başarıyla silindi.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});
// routes/categories.js (module.exports'un üstüne ekleyin)

// PUT /api/categories/:id - Bir kategoriyi ID'ye göre güncelle
router.put('/:id', async (req, res) => {
  try {
    // 1. Güncellenecek ID'yi URL'den al (req.params)
    const categoryId = req.params.id;
    // Yeni verileri Body'den al (req.body)
    const { name, type } = req.body;
    // Kullanıcıyı Token'dan al (req.user)
    const userId = req.user.id;

    // 2. Doğrulama
    if (!name || !type) {
      return res.status(400).json({ hata: 'Yeni kategori adı (name) ve tipi (type) zorunludur.' });
    }
    if (type !== 'gelir' && type !== 'gider') {
      return res.status(400).json({ hata: "Tip, 'gelir' veya 'gider' olmalıdır." });
    }

    // 3. Güncelleme İşlemi
    // 'UPDATE' sorgusu ile hem ID'yi hem de user_id'yi kontrol ediyoruz.
    // Bu, kullanıcının SADECE KENDİSİNE ait bir kategoriyi
    // güncelleyebilmesini garanti eder.
    const updateCategory = await pool.query(
      `UPDATE categories 
       SET name = $1, type = $2 
       WHERE id = $3 AND user_id = $4 
       RETURNING *`, // Güncellenen satırı geri döndür
      [name, type, categoryId, userId]
    );

    // 4. Kontrol
    // updateCategory.rows.length 0 ise, ya kategori bulunamadı
    // ya da kategori bu kullanıcıya ait değildi.
    if (updateCategory.rows.length === 0) {
      return res.status(404).json({ hata: 'Kategori bulunamadı veya bu kategori üzerinde yetkiniz yok.' });
    }

    // 5. Başarılı yanıt
    res.status(200).json(updateCategory.rows[0]);

  } catch (err) {
    // Unique kısıtlama hatası (Aynı isim/tipte başka bir kategori zaten varsa)
    if (err.code === '23505') {
      return res.status(400).json({ hata: 'Bu isim ve tipte bir kategori zaten mevcut.' });
    }
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});
module.exports = router;