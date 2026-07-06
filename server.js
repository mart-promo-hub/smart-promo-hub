const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// المفتاح الجديد المعتمد بعد التحديث
const PI_API_KEY = "lu8qgada4cgkmpqy0ssg4eelc1ebeth1rpwa4swca7yhjqxbqxsvoea5f2jjzw3g"; 
const PI_API_URL = "https://api.minepi.com/v2/payments";

// 1. مسار الموافقة المبدئية (Approve)
app.post('/api/pi/approve', async (req, res) => {
    const { paymentId, campaignId } = req.body;
    
    try {
        console.log(`📡 جاري الموافقة على الدفع: ${paymentId}`);
        const response = await axios.post(
            `${PI_API_URL}/${paymentId}/approve`,
            {},
            {
                headers: { 
                    'Authorization': `Key ${PI_API_KEY}`,
                    'Content-Type': 'application/json' 
                },
                timeout: 5000 
            }
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ خطأ في Approve:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "فشل الاتصال بـ Pi" });
    }
});

// 2. مسار الإغلاق (Complete)
app.post('/api/pi/complete', async (req, res) => {
    const { paymentId, txid } = req.body;

    try {
        console.log(`📡 جاري إغلاق المعاملة: ${paymentId}`);
        const response = await axios.post(
            `${PI_API_URL}/${paymentId}/complete`,
            { txid: txid },
            {
                headers: { 
                    'Authorization': `Key ${PI_API_KEY}`,
                    'Content-Type': 'application/json' 
                },
                timeout: 5000
            }
        );
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ خطأ في Complete:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "فشل إغلاق المعاملة" });
    }
});

// تشغيل الواجهة الأمامية
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر الخلفي يعمل بنجاح على المنفذ ${PORT}`);
});
