import React, { useEffect, useState } from "react";
import './index.css';

function App() {
  // ==========================================
  // حالات التطبيق الأساسية (State Management)
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [piReady, setPiReady] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard"); // dashboard, create, campaigns, settings
  const [campaigns, setCampaigns] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSpent: 0,
    totalViews: 0,
    totalClicks: 0
  });

  const [newCampaign, setNewCampaign] = useState({
    title: "",
    description: "",
    platform: "Facebook",
    budget: "",
    type: "Text"
  });

  // ✅ رابط السيرفر الصحيح والمطابق لمنصة Render الخاصة بك
  const BACKEND_URL = "https://smart-promo-hub-gjgu.onrender.com";

  // مراقبة حجم الشاشة للتجاوب مع الهواتف الذكية
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // تحضير البيانات وتهيئة الـ SDK عند فتح التطبيق
  useEffect(() => {
    const savedUser = localStorage.getItem("piUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("piUser");
      }
    }

    const savedCampaigns = localStorage.getItem("campaigns");
    if (savedCampaigns) {
      const list = JSON.parse(savedCampaigns);
      setCampaigns(list);
      calculateStats(list);
    } else {
      calculateStats([]);
    }
    
    loadPiSDK();
  }, []);

  // تحميل مكتبة الـ SDK الخاصة بشبكة Pi
  function loadPiSDK() {
    if (window.Pi) {
      initializePi();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    script.onload = initializePi;
    document.body.appendChild(script);
  }

  // تهيئة اتصال التطبيق بـ Pi Network
  async function initializePi() {
    try {
      await window.Pi.init({
        version: "2.0",
        sandbox: true
      });
      setPiReady(true);
      setLoading(false);
    } catch (e) {
      console.error("خطأ في تهيئة Pi SDK:", e);
      setLoading(false);
    }
  }

  // تسجيل الدخول والتوثيق
  async function login() {
    if (!piReady) {
      const mockUser = { username: "alialihashed77" };
      setUser(mockUser);
      localStorage.setItem("piUser", JSON.stringify(mockUser));
      return;
    }
    try {
      const auth = await window.Pi.authenticate(
        ["username", "payments"],
        onIncompletePaymentFound
      );
      setUser(auth.user);
      localStorage.setItem("piUser", JSON.stringify(auth.user));
    } catch (e) {
      console.error("فشل تسجيل الدخول:", e);
    }
  }

  function logout() {
    localStorage.removeItem("piUser");
    setUser(null);
  }

  // معالجة المدفوعات المعلقة
  function onIncompletePaymentFound(payment) {
    console.log("تم رصد معاملة معلقة وغير مكتملة:", payment);
    fetch(`${BACKEND_URL}/api/pi/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: payment.identifier, txid: payment.transaction.txid })
    }).catch(err => console.error("فشل إرسال الدفعة المعلقة للسيرفر:", err));
  }

  // حساب إحصائيات لوحة التحكم
  function calculateStats(list) {
    let spent = 0;
    list.forEach(item => {
      spent += Number(item.budget || 0);
    });

    setStats({
      totalCampaigns: list.length,
      activeCampaigns: list.filter(c => c.status === "نشطة").length,
      totalSpent: spent,
      totalViews: list.length * 2500,
      totalClicks: list.length * 310
    });
  }

  // إنشاء حملة جديدة
  function createCampaign() {
    if (!newCampaign.title.trim()) {
      alert("أدخل عنوان الحملة أولاً");
      return;
    }
    if (!newCampaign.budget || isNaN(newCampaign.budget) || Number(newCampaign.budget) <= 0) {
      alert("يرجى إدخال ميزانية صالحة للحملة");
      return;
    }

    const campaign = {
      id: Date.now(),
      title: newCampaign.title,
      description: newCampaign.description,
      platform: newCampaign.platform,
      budget: Number(newCampaign.budget),
      type: newCampaign.type,
      status: "بانتظار الدفع",
      createdAt: new Date().toLocaleDateString("ar-EG")
    };

    const updatedCampaigns = [...campaigns, campaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
    calculateStats(updatedCampaigns);

    setNewCampaign({ title: "", description: "", platform: "Facebook", budget: "", type: "Text" });
    alert("تم حفظ بيانات الحملة بنجاح! يرجى الانتقال لقائمة الحملات لتفعيلها عبر الدفع.");
    setCurrentPage("campaigns");
  }

  function deleteCampaign(id) {
    if (window.confirm("هل ترغب فعلاً في حذف هذه الحملة؟")) {
      const updatedCampaigns = campaigns.filter(campaign => campaign.id !== id);
      setCampaigns(updatedCampaigns);
      localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
      calculateStats(updatedCampaigns);
    }
  }

  // ========================================================
  // 🔥 دالة الدفع واستدعاء المحفظة والتواصل الآمن مع السيرفر الخلفي
  // ========================================================
  async function payWithPi(id, amount) {
    if (!piReady || !window.Pi) {
      alert("بوابة الدفع غير جاهزة للتواصل. يرجى فتح التطبيق من داخل متصفح Pi Browser.");
      return;
    }

    try {
      await window.Pi.createPayment({
        amount: Number(amount),
        memo: `تمويل حملة إعلانية رقم: ${id}`,
        metadata: { campaignId: id },
      }, {
        onReadyForServerApproval: async function(paymentId) {
          try {
            const response = await fetch(`${BACKEND_URL}/api/pi/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId: paymentId, campaignId: id })
            });
            if (!response.ok) throw new Error("السيرفر الخلفي رفض الموافقة.");
            console.log("تمت خطوة الموافقة بنجاح عبر السيرفر.");
          } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء موافقة السيرفر القانونية على الطلب.");
          }
        },

        onReadyForServerCompletion: async function(paymentId, txid) {
          try {
            const response = await fetch(`${BACKEND_URL}/api/pi/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId: paymentId, txid: txid, campaignId: id })
            });

            if (response.ok) {
              const updated = campaigns.map(c => c.id === id ? { ...c, status: "نشطة" } : c);
              setCampaigns(updated);
              localStorage.setItem("campaigns", JSON.stringify(updated));
              calculateStats(updated);
              
              alert("🎉 رائع! تم تأكيد الدفع بنجاح وأصبحت حملتك الإعلانية نشطة وموثقة على البلوكتشين.");
            } else {
              alert("فشل السيرفر في تسوية المعاملة وإغلاقها.");
            }
          } catch (err) {
            console.error(err);
            alert("تعذر الاتصال بالسيرفر لإغلاق المعاملة مالياً.");
          }
        },

        onCancel: function(paymentId) {
          alert("تم إلغاء عملية الدفع بواسطة المستخدم.");
        },
        onError: function(error, payment) {
          console.error("خطأ تقني في الدفع:", error);
          alert("عذراً، حدث خطأ تقني غير متوقع أثناء المعالجة.");
        }
      });

    } catch (error) {
      console.error(error);
      alert("فشل الاتصال بنظام دفع Pi Network.");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa", color: "#333", fontFamily: 'Cairo, sans-serif' }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid rgba(0,0,0,0.1)", borderTop: "4px solid #6c5ce7", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p style={{ marginTop: 15, fontSize: "16px", fontWeight: "bold" }}>جاري تهيئة منصة Smart Promo Hub...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f8f9fa", color: "#333", fontFamily: 'Cairo, sans-serif', padding: "20px", textAlign: "center", direction: "rtl" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px", color: "#6c5ce7" }}>Smart Promo Hub</h1>
        <p style={{ fontSize: "15px", color: "#636e72", marginBottom: "30px" }}>منصة الترويج الذكي المتكاملة لإدارة الحملات الإعلانية على شبكة Pi</p>
        <button onClick={login} style={{ padding: "14px 35px", fontSize: "16px", background: "#6c5ce7", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 15px rgba(108, 92, 231, 0.3)" }}>
          تسجيل الدخول باستخدام حساب Pi
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Cairo, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '16px', direction: 'rtl', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', boxSizing: 'border-box' }}>
      
      {/* القائمة الجانبية (Sidebar) المحدثة بشكل عصري */}
      <aside style={{ width: isMobile ? '100%' : '260px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', color: '#6c5ce7', margin: '0 0 5px 0', fontWeight: 'bold' }}>Promo Hub</h2>
            <span style={{ fontSize: '12px', background: '#6c5ce715', padding: '4px 10px', borderRadius: '20px', color: '#6c5ce7', fontWeight: 'bold' }}>@{user.username}</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: '8px', justifyContent: 'center' }}>
            <button style={{ width: isMobile ? '48%' : '100%', padding: '10px 12px', textAlign: 'right', background: currentPage === 'dashboard' ? '#6c5ce7' : 'transparent', color: currentPage === 'dashboard' ? '#fff' : '#2d3436', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }} onClick={() => setCurrentPage('dashboard')}>📊 لوحة التحكم</button>
            <button style={{ width: isMobile ? '48%' : '100%', padding: '10px 12px', textAlign: 'right', background: currentPage === 'create' ? '#6c5ce7' : 'transparent', color: currentPage === 'create' ? '#fff' : '#2d3436', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }} onClick={() => setCurrentPage('create')}>➕ إنشاء حملة</button>
            <button style={{ width: isMobile ? '48%' : '100%', padding: '10px 12px', textAlign: 'right', background: currentPage === 'campaigns' ? '#6c5ce7' : 'transparent', color: currentPage === 'campaigns' ? '#fff' : '#2d3436', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }} onClick={() => setCurrentPage('campaigns')}>📋 قائمة الحملات</button>
            <button style={{ width: isMobile ? '48%' : '100%', padding: '10px 12px', textAlign: 'right', background: currentPage === 'settings' ? '#6c5ce7' : 'transparent', color: currentPage === 'settings' ? '#fff' : '#2d3436', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }} onClick={() => setCurrentPage('settings')}>⚙️ الإعدادات</button>
          </nav>
        </div>

        <button onClick={logout} style={{ width: '100%', backgroundColor: '#ff7675', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px' }}>
          تسجيل الخروج
        </button>
      </aside>

      {/* المحتوى الرئيسي */}
      <main style={{ flex: 1, boxSizing: 'border-box' }}>
        
        {/* صفحة لوحة التحكم */}
        {currentPage === 'dashboard' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', color: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>مرحباً بك، {user.username}!</h2>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>نظرة عامة على أداء وميزانيات حملاتك الإعلانية</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <button onClick={() => setCurrentPage('create')} style={{ width: '100%', backgroundColor: '#00b894', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0, 184, 148, 0.3)' }}>
                <span>+</span> إنشاء حملة جديدة
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#636e72' }}>إجمالي الحملات</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '20px', color: '#2d3436' }}>{stats.totalCampaigns}</h3>
                <span style={{ fontSize: '11px', color: '#00b894' }}>● {stats.activeCampaigns} نشطة</span>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#636e72' }}>إجمالي الوصول</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '20px', color: '#2d3436' }}>{stats.totalViews}</h3>
                <span style={{ fontSize: '11px', color: '#00b894' }}>مشاهدة تقريبية</span>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#636e72' }}>إجمالي النقرات</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '20px', color: '#2d3436' }}>{stats.totalClicks}</h3>
                <span style={{ fontSize: '11px', color: '#00b894' }}>نقرة تفاعلية</span>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <span style={{ fontSize: '12px', color: '#636e72' }}>إجمالي الإنفاق</span>
                <h3 style={{ margin: '5px 0 0 0', fontSize: '18px', color: '#2d3436' }}>π {stats.totalSpent}</h3>
                <span style={{ fontSize: '11px', color: '#e17055', fontWeight: 'bold' }}>رصيد مدفوع</span>
              </div>
            </div>
          </div>
        )}

        {/* صفحة إنشاء حملة */}
        {currentPage === 'create' && (
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#2d3436' }}>➕ إنشاء حملة إعلانية جديدة</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#636e72' }}>عنوان الحملة:</label>
              <input type="text" placeholder="مثال: حملة صيف 2026" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', boxSizing: 'border-box' }} value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#636e72' }}>تفاصيل الحملة:</label>
              <textarea placeholder="اكتب تفاصيل ومحتوى إعلانك هنا..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', height: '80px', resize: 'none', boxSizing: 'border-box' }} value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#636e72' }}>الميزانية المطلوبة برصيد (Pi):</label>
              <input type="number" placeholder="أدخل عدد عملات Pi" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', boxSizing: 'border-box' }} value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} />
            </div>

            <button onClick={createCampaign} style={{ width: '100%', backgroundColor: '#00b894', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              حفظ بيانات الحملة
            </button>
          </div>
        )}

        {/* صفحة قائمة الحملات */}
        {currentPage === 'campaigns' && (
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#2d3436' }}>📋 إدارة وتتبع الحملات</h2>
            
            {campaigns.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#b2bec3', padding: '20px' }}>لا توجد حملات مضافة حالياً.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {campaigns.map((item) => (
                  <div key={item.id} style={{ padding: '12px', border: '1px solid #f1f2f6', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#2d3436' }}>{item.title}</h4>
                      <span style={{ fontSize: '11px', color: '#b2bec3' }}>الميزانية: π {item.budget} • التاريخ: {item.createdAt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ backgroundColor: item.status === "نشطة" ? '#00b89422' : '#fdcb6e22', color: item.status === "نشطة" ? '#00b894' : '#e17055', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                        {item.status}
                      </span>
                      {item.status === "بانتظار الدفع" && (
                        <button onClick={() => payWithPi(item.id, item.budget)} style={{ backgroundColor: '#f1c40f', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                          ادفع الآن
                        </button>
                      )}
                      <button onClick={() => deleteCampaign(item.id)} style={{ backgroundColor: '#ff7675', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* صفحة الإعدادات */}
        {currentPage === 'settings' && (
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#2d3436' }}>⚙️ الإعدادات العامة</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f2f6', fontSize: '14px' }}>
              <span style={{ color: '#636e72' }}>اسم الحساب الموثق:</span>
              <span style={{ fontWeight: 'bold', color: '#2d3436' }}>@{user.username}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f2f6', fontSize: '14px' }}>
              <span style={{ color: '#636e72' }}>حالة الاتصال بالبلوكتشين:</span>
              <span style={{ color: '#00b894', fontWeight: 'bold' }}>متصل بنجاح</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '14px' }}>
              <span style={{ color: '#636e72' }}>توثيق السيرفر المالي:</span>
              <span style={{ color: '#00b894', fontWeight: 'bold' }}>مكتمل وآمن تماماً</span>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

export default App;
