import React, { useState } from 'react';
import './index.css';

// ==================== إعدادات Pi Network ====================
const PI_CONFIG = {
  clientId: "-A4TB3A70xaV8msc-OzXbB_PMhCHqIu5KHbgr_BKS2o",
  redirectUri: "https://smart-promo-hub.onrender.com/auth/pi/callback"
};

// ==================== دالة تسجيل الدخول ====================
const handlePiLogin = () => {
  const authUrl = `https://app.pi-network.com/authenticate?client_id=${PI_CONFIG.clientId}&redirect_uri=${encodeURIComponent(PI_CONFIG.redirectUri)}&response_type=code`;
  window.location.href = authUrl;
};

// ==================== البيانات الأولية ====================
const INITIAL_CAMPAIGNS = [
  { id: 1, name: 'حملة العيد', type: 'نص', platform: 'فيسبوك', status: 'نشطة', budget: 500, spent: 320, reach: 45000, clicks: 2300, engagement: 1200, conversions: 45, impressions: 52000, ctr: 4.4, roi: 22, start: '2026-06-01', end: '2026-06-30' },
  { id: 2, name: 'عرض الصيف', type: 'صورة', platform: 'إنستغرام', status: 'مجدولة', budget: 300, spent: 0, reach: 0, clicks: 0, engagement: 0, conversions: 0, impressions: 0, ctr: 0, roi: 0, start: '2026-07-01', end: '2026-07-31' },
  { id: 3, name: 'إطلاق منتج', type: 'فيديو', platform: 'يوتيوب', status: 'منتهية', budget: 800, spent: 800, reach: 82600, clicks: 3700, engagement: 2400, conversions: 89, impressions: 92000, ctr: 4.0, roi: 34, start: '2026-05-01', end: '2026-05-31' },
  { id: 4, name: 'توعوية', type: 'كاروسيل', platform: 'تويتر', status: 'منتهية', budget: 200, spent: 200, reach: 15000, clicks: 800, engagement: 400, conversions: 12, impressions: 18000, ctr: 4.4, roi: 18, start: '2026-04-15', end: '2026-05-15' },
];

const GLOBAL_STATS = { reach: 127600, clicks: 6000, engagement: 3600, spent: 1216 };

// ==================== مكون الرسم البياني ====================
const SimpleChart = ({ data, color, label }) => {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${i * 50},${200 - (v / max) * 180}`).join(' ');
  return (
    <div className="chart-container">
      <h4>{label}</h4>
      <svg viewBox="0 0 250 200">
        <polyline points={points} fill="none" stroke={color} strokeWidth="3" />
        {data.map((v, i) => (
          <circle key={i} cx={i * 50} cy={200 - (v / max) * 180} r="4" fill={color} />
        ))}
        <text x="10" y="190" fill="#a7a9be" fontSize="12">الأسبوع</text>
      </svg>
    </div>
  );
};

// ==================== التطبيق الرئيسي ====================
function App() {
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [filter, setFilter] = useState('الكل');
  const [page, setPage] = useState('dashboard');
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'نص', platform: 'فيسبوك', status: 'نشطة', budget: 100, text: '' });
  const [aiText, setAiText] = useState('');
  const [balance, setBalance] = useState(10);

  // ===== توليد النصوص =====
  const generateAIText = (campaignName) => {
    const templates = [
      `🚀 اكتشف العرض الحصري! لا تفوّت فرصة الحصول على ${campaignName} بأفضل الأسعار. عروض محدودة وخصومات تصل إلى 50%! سارع بالحجز الآن. #عرض_حصري #تسوق #صفقة`,
      `✨ ${campaignName} – الحل الأمثل لك! جودة عالية، خدمة ممتازة، وأسعار لا تُقارن. انضم إلى آلاف العملاء السعداء اليوم. #تميز #جودة #ريادة`,
      `📢 ${campaignName} بين يديك! عروض حصرية للمتابعين الكرام. خصم 30% لفترة محدودة. لا تتردد في اقتناص الفرصة! #عرض_خاص #تخفيضات #تسوق_أونلاين`,
      `🌟 انطلق مع ${campaignName} وكن جزءاً من النجاح! مميزات لا حصر لها، دعم فني متواصل، وتجربة فريدة. #النجاح_يبدأ_هنا #ابتكار #تطوير`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const handleGenerateAI = () => {
    const text = generateAIText(newCampaign.name || 'الحملة الإعلانية');
    setAiText(text);
    setNewCampaign({ ...newCampaign, text });
  };

  // ===== إدارة الحملات =====
  const addCampaign = () => {
    if (!newCampaign.name.trim()) return alert('⚠️ الرجاء إدخال اسم الحملة');
    if (newCampaign.budget <= 0) return alert('⚠️ الميزانية يجب أن تكون أكبر من صفر');
    
    const campaign = {
      id: Date.now(),
      name: newCampaign.name,
      type: newCampaign.type || 'نص',
      platform: newCampaign.platform || 'فيسبوك',
      status: 'نشطة',
      budget: Number(newCampaign.budget) || 100,
      spent: 0,
      reach: Math.floor(Math.random() * 10000) + 1000,
      clicks: Math.floor(Math.random() * 500) + 50,
      engagement: Math.floor(Math.random() * 300) + 30,
      conversions: Math.floor(Math.random() * 20) + 1,
      impressions: Math.floor(Math.random() * 15000) + 2000,
      ctr: (Math.random() * 5 + 1).toFixed(1),
      roi: (Math.random() * 30 + 5).toFixed(1),
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      text: newCampaign.text || '',
    };
    setCampaigns([campaign, ...campaigns]);
    setNewCampaign({ name: '', type: 'نص', platform: 'فيسبوك', status: 'نشطة', budget: 100, text: '' });
    setAiText('');
    alert('✅ تم إنشاء الحملة بنجاح!');
  };

  const deleteCampaign = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحملة؟')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
      alert('🗑️ تم حذف الحملة');
    }
  };

  const showResults = (id) => {
    const c = campaigns.find(c => c.id === id);
    if (!c) return alert('الحملة غير موجودة');
    alert(`📊 نتائج الحملة: ${c.name}\n\n📈 المشاهدات: ${c.impressions.toLocaleString()}\n🖱️ النقرات: ${c.clicks.toLocaleString()}\n📊 CTR: ${c.ctr}%\n❤️ التفاعل: ${c.engagement.toLocaleString()}\n🔄 التحويلات: ${c.conversions}\n💰 العائد (ROI): ${c.roi}%\n💵 الميزانية: ${c.budget} π`);
  };

  const buyPackage = (price) => {
    if (balance < price) return alert(`⚠️ رصيدك غير كافٍ! رصيدك الحالي: ${balance} π`);
    if (window.confirm(`هل تريد شراء الباقة بـ ${price} π؟`)) {
      setBalance(balance - price);
      alert(`✅ تم شراء الباقة بنجاح! رصيدك المتبقي: ${balance - price} π`);
    }
  };

  const filteredCampaigns = filter === 'الكل' ? campaigns : campaigns.filter(c => c.status === filter);
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'نشطة').length,
    scheduled: campaigns.filter(c => c.status === 'مجدولة').length,
    completed: campaigns.filter(c => c.status === 'منتهية').length,
  };

  // ===== عرض الصفحات =====
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <div>
            <h2>📊 لوحة التحكم</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span></span>
              <button 
                onClick={handlePiLogin} 
                style={{ 
                  background: '#6c5ce7', 
                  padding: '8px 16px', 
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                <span>⛓️</span> تسجيل الدخول بـ Pi
              </button>
            </div>
            <div className="stats-grid">
              <div className="stats-card">💰 الرصيد: {balance} π</div>
              <div className="stats-card">📌 إجمالي الحملات: {stats.total}</div>
              <div className="stats-card">✅ نشطة: {stats.active}</div>
              <div className="stats-card">⏳ مجدولة: {stats.scheduled}</div>
              <div className="stats-card">📋 منتهية: {stats.completed}</div>
              <div className="stats-card">📈 وصول: {GLOBAL_STATS.reach.toLocaleString()}</div>
              <div className="stats-card">🖱️ نقرات: {GLOBAL_STATS.clicks.toLocaleString()}</div>
              <div className="stats-card">❤️ تفاعل: {GLOBAL_STATS.engagement.toLocaleString()}</div>
              <div className="stats-card">💰 إنفاق: {GLOBAL_STATS.spent} π</div>
            </div>
            <div className="stats-grid">
              <SimpleChart data={[120, 150, 180, 220, 260, 310, 400]} color="#6c5ce7" label="📈 المشاهدات" />
              <SimpleChart data={[40, 55, 70, 90, 110, 140, 180]} color="#ff6b6b" label="🖱️ النقرات" />
              <SimpleChart data={[30, 45, 60, 80, 100, 130, 170]} color="#4ecdc4" label="❤️ التفاعل" />
            </div>
          </div>
        );

      case 'create':
        return (
          <div>
            <h2>📝 إنشاء حملة جديدة</h2>
            <p>💰 رصيدك الحالي: <strong>{balance} π</strong></p>
            <div className="card">
              <input type="text" placeholder="اسم الحملة" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              <select value={newCampaign.type} onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}>
                <option value="نص">📝 نص</option>
                <option value="صورة">🖼️ صورة</option>
                <option value="فيديو">🎬 فيديو</option>
                <option value="كاروسيل">🎠 كاروسيل</option>
              </select>
              <select value={newCampaign.platform} onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })}>
                <option value="فيسبوك">فيسبوك</option>
                <option value="إنستغرام">إنستغرام</option>
                <option value="تويتر">تويتر</option>
                <option value="يوتيوب">يوتيوب</option>
                <option value="تيك توك">تيك توك</option>
                <option value="لينكدإن">لينكدإن</option>
                <option value="سناب شات">سناب شات</option>
                <option value="واتساب">واتساب</option>
                <option value="تيليجرام">تيليجرام</option>
                <option value="بينترست">بينترست</option>
              </select>
              <textarea placeholder="نص الإعلان" rows="4" value={newCampaign.text || ''} onChange={(e) => setNewCampaign({ ...newCampaign, text: e.target.value })} />
              <button onClick={handleGenerateAI} style={{ background: '#ff6b6b' }}>🤖 توليد نص بالذكاء الاصطناعي</button>
              {aiText && <div className="card" style={{ background: '#2d1b69' }}>{aiText}</div>}
              <input type="number" placeholder="الميزانية (π)" value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} />
              <button onClick={addCampaign} style={{ background: '#4ecdc4' }}>🚀 إنشاء الحملة</button>
            </div>
          </div>
        );

      case 'campaigns':
        return (
          <div>
            <h2>📋 حملاتي</h2>
            <div className="nav-bar">
              {['الكل', 'نشطة', 'مجدولة', 'منتهية'].map(f => (
                <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            {filteredCampaigns.length === 0 ? (
              <p style={{ color: '#a7a9be' }}>⚠️ لا توجد حملات في هذا التصنيف</p>
            ) : (
              filteredCampaigns.map(c => (
                <div key={c.id} className="card" style={{ borderRight: `4px solid ${c.status === 'نشطة' ? '#4ecdc4' : c.status === 'مجدولة' ? '#ffd93d' : '#ff6b6b'}` }}>
                  <h3>{c.name}</h3>
                  <p>📌 النوع: {c.type} | المنصة: {c.platform} | الحالة: {c.status}</p>
                  <p>💰 الميزانية: {c.budget} π | المصروف: {c.spent} π</p>
                  <p>📈 المشاهدات: {c.impressions.toLocaleString()} | النقرات: {c.clicks.toLocaleString()} | CTR: {c.ctr}% | التفاعل: {c.engagement.toLocaleString()}</p>
                  <p>📊 العائد (ROI): {c.roi}%</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => showResults(c.id)}>📊 عرض النتائج</button>
                    <button onClick={() => deleteCampaign(c.id)} style={{ background: '#ff6b6b' }}>🗑️ حذف</button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'settings':
        return (
          <div>
            <h2>⚙️ الإعدادات</h2>
            <div className="card">
              <div style={{ background: '#1a1a2e', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <h3 style={{ color: '#6c5ce7' }}>🔐 تسجيل الدخول عبر Pi</h3>
                <p style={{ fontSize: '14px', color: '#a7a9be' }}>استخدم حساب Pi الخاص بك لتسجيل الدخول إلى المنصة</p>
                <button 
                  onClick={handlePiLogin} 
                  style={{ 
                    background: '#6c5ce7', 
                    padding: '12px 24px', 
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <span>⛓️</span> تسجيل الدخول بـ Pi
                </button>
              </div>
              <p>💰 رصيدك الحالي: <strong>{balance} π</strong></p>
              <button onClick={() => setBalance(balance + 5)} style={{ background: '#4ecdc4' }}>➕ إضافة 5 π (تجريبي)</button>
              <hr style={{ borderColor: '#6c5ce7', margin: '16px 0' }} />
              <h3>📦 شراء باقات</h3>
              <div className="stats-grid">
                <div className="stats-card">
                  <p>🤖 باقة الذكاء الاصطناعي</p>
                  <p><strong>0.5 π</strong></p>
                  <button onClick={() => buyPackage(0.5)}>شراء</button>
                </div>
                <div className="stats-card">
                  <p>📊 تحليل متقدم</p>
                  <p><strong>1 π</strong></p>
                  <button onClick={() => buyPackage(1)}>شراء</button>
                </div>
                <div className="stats-card">
                  <p>🚀 باقة بريميوم</p>
                  <p><strong>5 π</strong></p>
                  <button onClick={() => buyPackage(5)}>شراء</button>
                </div>
              </div>
              <hr style={{ borderColor: '#6c5ce7', margin: '16px 0' }} />
              <p>🔑 المفاتيح: تم حذفها لأسباب أمنية ✅</p>
              <p>🌐 اللغة: العربية (RTL)</p>
              <p>📱 الحالة: متصل (بدون مفاتيح)</p>
              <button>💾 حفظ الإعدادات</button>
            </div>
          </div>
        );

      case 'developer':
        return (
          <div>
            <h2>👨‍💻 تفاصيل المطور</h2>
            <div className="card">
              <p><strong>اسم المطور:</strong> Smart Promo Hub</p>
              <p><strong>الموقع:</strong> <a href="https://smartprq1318.pinet.com" style={{ color: '#6c5ce7' }}>smartprq1318.pinet.com</a></p>
              <p><strong>المستودع:</strong> <a href="https://github.com/mart-promo-hub/smart-promo-hub" style={{ color: '#6c5ce7' }}>GitHub</a></p>
              <p><strong>سياسة الخصوصية:</strong> <a href="https://github.com/mart-promo-hub/smart-promo-hub/blob/main/PRIVACY_POLICY.md" style={{ color: '#6c5ce7' }}>رابط</a></p>
              <p><strong>البريد الإلكتروني:</strong> ailailhashed2020@gmail.com</p>
              <button onClick={() => navigator.clipboard.writeText('ailailhashed2020@gmail.com')}>📋 نسخ البريد</button>
              <hr style={{ borderColor: '#6c5ce7', margin: '16px 0' }} />
              <p style={{ color: '#4ecdc4' }}>✅ التطبيق يعمل بدون مفاتيح خارجية</p>
              <p style={{ color: '#a7a9be', fontSize: '14px' }}>تم حذف جميع المفاتيح لأسباب أمنية</p>
            </div>
          </div>
        );

      default:
        return <h2>⚠️ الصفحة غير موجودة</h2>;
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ color: '#6c5ce7' }}>🚀 منصة الترويج الذكي</h1>
        <div style={{ fontSize: '14px', color: '#a7a9be' }}>v2.0 - بدون مفاتيح</div>
      </div>

      <nav className="nav-bar">
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>📊 الرئيسية</button>
        <button className={page === 'create' ? 'active' : ''} onClick={() => setPage('create')}>📝 إنشاء حملة</button>
        <button className={page === 'campaigns' ? 'active' : ''} onClick={() => setPage('campaigns')}>📋 حملاتي</button>
        <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>⚙️ الإعدادات</button>
        <button className={page === 'developer' ? 'active' : ''} onClick={() => setPage('developer')}>👨‍💻 المطور</button>
      </nav>

      <div style={{ minHeight: '400px' }}>{renderPage()}</div>

      <div style={{ textAlign: 'center', marginTop: '32px', color: '#a7a9be', fontSize: '12px' }}>
        © 2026 Smart Promo Hub - منصة الترويج الذكي
      </div>
    </div>
  );
}

export default App;
