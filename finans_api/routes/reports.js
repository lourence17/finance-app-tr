// routes/reports.js (Tarih Filtresi Eklendi)

const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// GET /api/reports/summary (GÜNCELLENDİ)
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    // YENİ: URL'den tarih parametrelerini al (örn: ?startDate=...&endDate=...)
    const { startDate, endDate } = req.query;

    // -----------------------------------------------------------
    // YENİ: Dinamik SQL Sorgusu Oluşturma
    // -----------------------------------------------------------
    
    // Temel sorgu metni
    let summaryQueryText = `
      SELECT
        c.type,
        SUM(t.amount) AS total_amount
      FROM
        transactions t
      JOIN
        categories c ON t.category_id = c.id
      WHERE
        t.user_id = $1
    `;
    
    // Sorguya gönderilecek parametreler (ilk parametre her zaman userId)
    const queryParams = [userId];
    
    // Eğer tarihler frontend'den geldiyse:
    if (startDate && endDate) {
      // Ana sorguya tarih filtresini (AND ...) ekle
      summaryQueryText += ' AND t.transaction_date BETWEEN $2 AND $3';
      // Parametrelere tarihleri ekle
      queryParams.push(startDate, endDate);
    }
    
    // Sorgunun sonunu ekle
    summaryQueryText += ' GROUP BY c.type;';
    // -----------------------------------------------------------

    // Dinamik sorguyu ve parametreleri çalıştır
    const summaryResult = await pool.query(summaryQueryText, queryParams);

    // Kalan kısım (JSON'a dönüştürme) aynı
    let total_gelir = 0;
    let total_gider = 0;
    for (const row of summaryResult.rows) {
      if (row.type === 'gelir') {
        total_gelir = parseFloat(row.total_amount);
      } else if (row.type === 'gider') {
        total_gider = parseFloat(row.total_amount);
      }
    }
    const net_bakiye = total_gelir - total_gider;

    res.status(200).json({
      total_gelir,
      total_gider,
      net_bakiye: parseFloat(net_bakiye.toFixed(2)) 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

module.exports = router;