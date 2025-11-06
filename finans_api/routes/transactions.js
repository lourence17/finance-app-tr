// routes/transactions.js (Tarih Filtresi Eklendi)

const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// POST /api/transactions - Yeni bir işlem ekle (Değişiklik yok)
router.post('/', async (req, res) => {
  // ... (Bu fonksiyonun tamamı aynı, değişiklik yok) ...
  try {
    const { category_id, amount, transaction_date, description } = req.body;
    const userId = req.user.id;
    if (!category_id || !amount || !transaction_date) {
      return res.status(400).json({ hata: 'Kategori ID, Tutar ve İşlem Tarihi zorunludur.' });
    }
    const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [category_id, userId]);
    if (categoryCheck.rows.length === 0) {
      return res.status(403).json({ hata: 'Bu kategoriye işlem ekleme yetkiniz yok veya kategori bulunamadı.' });
    }
    const newTransaction = await pool.query(
      `INSERT INTO transactions (user_id, category_id, amount, transaction_date, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, category_id, amount, transaction_date, description]
    );
    res.status(201).json(newTransaction.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/transactions - İşlemleri listele (GÜNCELLENDİ)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    // YENİ: URL'den tarih parametrelerini al
    const { startDate, endDate } = req.query;

    // YENİ: Dinamik SQL Sorgusu
    let queryText = 'SELECT * FROM transactions WHERE user_id = $1';
    const queryParams = [userId];

    if (startDate && endDate) {
      queryText += ' AND transaction_date BETWEEN $2 AND $3';
      queryParams.push(startDate, endDate);
    }
    
    queryText += ' ORDER BY transaction_date DESC, id DESC'; // Tarihe göre (veya ID'ye) göre sırala

    const transactions = await pool.query(queryText, queryParams);
    res.status(200).json(transactions.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// DELETE /api/transactions/:id - İşlem sil (Değişiklik yok)
router.delete('/:id', async (req, res) => {
  // ... (Bu fonksiyonun tamamı aynı, değişiklik yok) ...
  try {
    const transactionId = req.params.id;
    const userId = req.user.id;
    const deleteOp = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *', [transactionId, userId]);
    if (deleteOp.rows.length === 0) {
      return res.status(404).json({ hata: 'İşlem bulunamadı veya bu işlem üzerinde yetkiniz yok.' });
    }
    res.status(200).json({ mesaj: 'İşlem başarıyla silindi.', silinenIslem: deleteOp.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// PUT /api/transactions/:id - İşlem güncelle (Değişiklik yok)
router.put('/:id', async (req, res) => {
  // ... (Bu fonksiyonun tamamı aynı, değişiklik yok) ...
  try {
    const transactionId = req.params.id;
    const userId = req.user.id;
    const { category_id, amount, transaction_date, description } = req.body;
    if (!category_id || !amount || !transaction_date) {
      return res.status(400).json({ hata: 'Kategori ID, Tutar ve İşlem Tarihi zorunludur.' });
    }
    const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [category_id, userId]);
    if (categoryCheck.rows.length === 0) {
      return res.status(403).json({ hata: 'Bu kategoriye işlem taşıma yetkiniz yok veya kategori bulunamadı.' });
    }
    const updateTransaction = await pool.query(
      `UPDATE transactions SET category_id = $1, amount = $2, transaction_date = $3, description = $4 WHERE id = $5 AND user_id = $6 RETURNING *`,
      [category_id, amount, transaction_date, description, transactionId, userId]
    );
    if (updateTransaction.rows.length === 0) {
      return res.status(404).json({ hata: 'İşlem bulunamadı veya bu işlem üzerinde yetkiniz yok.' });
    }
    res.status(200).json(updateTransaction.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;