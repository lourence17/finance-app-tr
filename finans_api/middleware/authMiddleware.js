// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// 'module.exports' ile bu fonksiyonu dışarıya aktarıyoruz
module.exports = function(req, res, next) {
  // 1. İsteğin "header" (başlık) kısmından token'ı al
  // Token'lar genellikle 'Authorization' başlığında 'Bearer [token]' formatında gönderilir.
  const authHeader = req.header('Authorization');

  // 2. Token var mı diye kontrol et
  if (!authHeader) {
    // 401 = Unauthorized (Yetkisiz Erişim)
    return res.status(401).json({ hata: 'Yetkisiz erişim. Token bulunamadı.' });
  }

  try {
    // 3. Token'ın 'Bearer ' kısmını ayıkla
    // Header şöyle görünür: "Bearer eyJhbGciOiJ..."
    // Bize sadece 'eyJhbGciOiJ...' kısmı lazım.
    const token = authHeader.split(' ')[1]; 
    
    if (!token) {
        return res.status(401).json({ hata: 'Token formatı geçersiz.' });
    }

    // 4. Token'ı Doğrula
    // jwt.verify, token'ı alır, .env'deki gizli anahtarımızla (JWT_SECRET) karşılaştırır.
    // Eğer token geçerliyse (süresi dolmamışsa ve imza doğruysa),
    // içindeki 'payload' (kullanıcı bilgileri) kısmını bize geri döndürür.
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Kullanıcı bilgisini 'req' (istek) objesine ekle
    // 'decodedPayload.user' objesini (login olurken ne koyduysak onu)
    // 'req.user' içine atıyoruz.
    req.user = decodedPayload.user;

    // 6. "Güvenlik görevlisi" izni verdi, bir sonraki adıma geç
    // 'next()' bir sonraki fonksiyona (yani asıl endpoint'in kendisine) geçilmesini sağlar.
    next();

  } catch (err) {
    // Token geçerli değilse (süresi dolmuş, imza yanlış vb.)
    res.status(401).json({ hata: 'Geçersiz token.' });
  }
};