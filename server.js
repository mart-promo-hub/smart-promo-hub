const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== إعدادات Pi Network ====================
const PI_CONFIG = {
  clientId: "-A4TB3A70xaV8msc-OzXbB_PMhCHqIu5KHbgr_BKS2o",
  redirectUri: "https://smart-promo-hub.onrender.com/auth/pi/callback"
};

// ==================== مسار استقبال الرد من Pi ====================
app.get('/auth/pi/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.send(`
      <h1>❌ خطأ في تسجيل الدخول</h1>
      <p>لم يتم استلام رمز من Pi Network. يرجى المحاولة مرة أخرى.</p>
      <a href="/">العودة إلى التطبيق</a>
    `);
  }

  try {
    const response = await axios.post('https://app.pi-network.com/api/v2/oauth/token', {
      client_id: PI_CONFIG.clientId,
      code: code,
      redirect_uri: PI_CONFIG.redirectUri,
      grant_type: 'authorization_code'
    });

    const { access_token, user } = response.data;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>تم تسجيل الدخول بنجاح</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; direction: rtl; }
            .container { max-width: 500px; margin: 0 auto; background: #f0f0f0; padding: 30px; border-radius: 15px; }
            h1 { color: #4ecdc4; }
            .info { text-align: right; margin: 20px 0; }
            .info p { margin: 8px 0; }
            .btn { display: inline-block; padding: 10px 20px; background: #6c5ce7; color: white; text-decoration: none; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ تم تسجيل الدخول بنجاح!</h1>
            <div class="info">
              <p><strong>🆔 معرف المستخدم:</strong> ${user.id}</p>
              <p><strong>👤 اسم المستخدم:</strong> ${user.username}</p>
              <p><strong>📧 البريد الإلكتروني:</strong> ${user.email || 'غير متاح'}</p>
              <p><strong>🔑 رمز الوصول:</strong> ${access_token.substring(0, 20)}...</p>
            </div>
            <a href="/" class="btn">🚀 الذهاب إلى لوحة التحكم</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data || error.message);
    res.send(`
      <h1>❌ حدث خطأ أثناء تسجيل الدخول</h1>
      <p>يرجى المحاولة مرة أخرى. إذا استمرت المشكلة، تأكد من إعدادات التطبيق.</p>
      <a href="/">العودة إلى التطبيق</a>
    `);
  }
});

// ==================== مسار معالجة الدفع ====================
app.post('/api/pay', async (req, res) => {
  const { amount, memo, user_id } = req.body;

  if (!amount || !user_id) {
    return res.status(400).json({ error: 'المبلغ ومعرف المستخدم مطلوبان' });
  }

  try {
    const mockPayment = {
      success: true,
      transaction_id: 'txn_' + Date.now(),
      amount: amount,
      status: 'completed'
    };

    res.json(mockPayment);
  } catch (error) {
    console.error('❌ خطأ في الدفع:', error);
    res.status(500).json({ error: 'فشلت عملية الدفع' });
  }
});

// ==================== خدمة الملفات الثابتة ====================
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// ==================== تشغيل الخادم ====================
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على المنفذ ${PORT}`);
  console.log(`🔗 رابط التطبيق: http://localhost:${PORT}`);
});
