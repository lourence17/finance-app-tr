// routes/users.js (Profil Güncelleme EKLENMİŞ TAM KOD)

const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Bu, bir önceki (atladığımız) adımdan kalmış olabilir, zararı yok.
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// --- KAYIT, GİRİŞ, PROFİL GETİRME (Değişiklik Yok) ---

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ hata: 'Email, şifre, isim ve soyisim zorunludur.' });
    }
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ hata: 'Bu email adresi zaten kullanılıyor.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, created_at',
      [email, passwordHash, firstName, lastName]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ hata: 'Email ve şifre zorunludur.' });
    }
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ hata: 'Geçersiz kimlik bilgileri.' });
    }
    const user = userCheck.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ hata: 'Geçersiz kimlik bilgileri.' });
    }
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name, 
        lastName: user.last_name
      }
    };
    jwt.sign(
      payload, process.env.JWT_SECRET, { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
        'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1', 
        [req.user.id]
    );
    if (user.rows.length === 0) {
       return res.status(404).json({ hata: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ hata: 'Sunucu hatası.' });
  }
});


// --- YENİ ENDPOINT 1: Profil Bilgisi Güncelleme (İsim/Soyisim) ---
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const userId = req.user.id; // Token'dan al

        if (!firstName || !lastName) {
            return res.status(400).json({ hata: 'İsim ve soyisim zorunludur.' });
        }

        const updatedUser = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id, email, first_name, last_name',
            [firstName, lastName, userId]
        );

        res.status(200).json(updatedUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: 'Sunucu hatası.' });
    }
});

// --- YENİ ENDPOINT 2: Şifre Değiştirme ---
router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ hata: 'Eski şifre ve yeni şifre zorunludur.' });
        }
        
        // 1. Kullanıcının mevcut (eski) şifresini DB'den al
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];

        // 2. Eski şifreyi doğrula
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ hata: 'Mevcut (eski) şifreniz yanlış.' });
        }

        // 3. Yeni şifreyi hash'le
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // 4. Yeni şifreyi DB'ye kaydet
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.status(200).json({ mesaj: 'Şifreniz başarıyla güncellendi.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ hata: 'Sunucu hatası.' });
    }
});


module.exports = router;