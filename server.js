const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

// تفعيل CORS لكي يتمكن متصفح Pi Browser من التواصل مع السيرفر بدون حجب أمني
app.use(cors());
app.use(express.json());

// ==========================================
// ✅ تم إضافة مفتاح الـ API الخاص بتطبيقك بنجاح
// ==========================================
const PI_API_KEY = "2wxcnbex5wnmfix6ojbk87hullo5pi8mo1met52sr98vq17nqksdjjnbrbhlicrm"; 

// رابط سيرفر Pi الرسمي للمدفوعات
const PI_API_URL = "https://api.minepi.com/v2/payments";

// ==========================================
// 1. مسار الموافقة المبدئية (Approve Payment)
// ==========================================
app.post('/api/pi/approve', async (req, res) => {
    const { paymentId, campaignId } = req.body;

    console.log(`📡 جاري إرسال طلب موافقة مبدئية لعملية الدفع: ${paymentId} الخاصة بالحملة: ${campaignId}`);

    try {
        // مراسلة سيرفر Pi لإخبارهم بأن سيرفرك وافق قانونياً على هذه العملية
        const response = await axios.post(
            `${PI_API_URL}/${paymentId}/approve`,
            {},
            {
                headers: {
                    'Authorization': `Key ${PI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ تم الموافقة على الدفعة رقم ${paymentId} بنجاح!`);
        return res.status(200).json({ success: true, data: response.data });

    } catch (error) {
        console.error("❌ خطأ في دالة Approve:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "فشلت عملية الموافقة من طرف السيرفر" });
    }
});

// ==========================================
// 2. مسار الإغلاق والتسوية النهائية (Complete Payment)
// ==========================================
app.post('/api/pi/complete', async (req, res) => {
    const { paymentId, txid, campaignId } = req.body;

    console.log(`📡 جاري إرسال طلب إغلاق المعاملة: ${paymentId} مع معرف البلوكتشين (txid): ${txid}`);

    try {
        // مراسلة سيرفر Pi لإغلاق المعاملة رسمياً بعد توقيع المستخدم بالبصمة/كلمة السر
        const response = await axios.post(
            `${PI_API_URL}/${paymentId}/complete`,
            { txid: txid },
            {
                headers: {
                    'Authorization': `Key ${PI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`🎉 تم إغلاق وتوثيق الدفعة ${paymentId} على البلوكتشين بنجاح للحملة ${campaignId}`);
        return res.status(200).json({ success: true, data: response.data });

    } catch (error) {
        console.error("❌ خطأ في دالة Complete:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "فشل إغلاق المعاملة وتسويتها مالياً على الشبكة" });
    }
});

// ==========================================
// إعدادات تشغيل واجهة React (Frontend) من السيرفر
// ==========================================
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// تشغيل السيرفر على المنفذ المحدد من قِبل Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر الخلفي المطور يعمل بنجاح ومستعد لمعالجة مدفوعات Pi على المنفذ ${PORT}`);
});
