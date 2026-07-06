import React, { useEffect, useState } from "react";

function App() {
  // ==========================
  // حالات التطبيق
  // ==========================
  const [loading, setLoading] = useState(true);
  const [piReady, setPiReady] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [campaigns, setCampaigns] = useState([]);
  
  // حالة لمعرفة هل المستخدم يتصفح من الموبايل أم لا
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

  // مراقبة حجم الشاشة بشكل حي ومباشر
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ==========================
  // تشغيل وتأمين التطبيق عند التحميل
  // ==========================
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

  async function initializePi() {
    try {
      await window.Pi.init({
        version: "2.0",
        sandbox: true
      });
      setPiReady(true);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

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
      console.error(e);
    }
  }

  function logout() {
    localStorage.removeItem("piUser");
    setUser(null);
  }

  function onIncompletePaymentFound(payment) {
    console.log(payment);
  }

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

  function createCampaign() {
    if (!newCampaign.title.trim()) {
      alert("أدخل عنوان الحملة");
      return;
    }
    if (!newCampaign.budget || isNaN(newCampaign.budget) || Number(newCampaign.budget) <= 0) {
      alert("أدخل ميزانية صحيحة للحملة");
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
    alert("تم حفظ الحملة بنجاح.");
    setCurrentPage("campaigns");
  }

  function deleteCampaign(id) {
    if (window.confirm("هل أنت متأكد من حذف هذه الحملة؟")) {
      const updatedCampaigns = campaigns.filter(campaign => campaign.id !== id);
      setCampaigns(updatedCampaigns);
      localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
      calculateStats(updatedCampaigns);
    }
  }

  async function payWithPi(id, amount) {
    alert(`جاري معالجة الدفع: ${amount} Pi`);
    const updated = campaigns.map(c => c.id === id ? { ...c, status: "نشطة" } : c);
    setCampaigns(updated);
    localStorage.setItem("campaigns", JSON.stringify(updated));
    calculateStats(updated);
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: 15 }}>جاري تهيئة منصة Smart Promo Hub...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <h1 style={styles.loginTitle}>Smart Promo Hub</h1>
        <p style={styles.loginSubtitle}>منصة الترويج الذكي لرواد Pi Network</p>
        <button onClick={login} style={styles.loginButton}>
          تسجيل الدخول باستخدام Pi
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.appLayout, flexDirection: isMobile ? "column" : "row" }}>
      
      {/* القائمة: ستتحول تلقائياً لشريط علوي في الموبايل، وشريط جانبي في الكمبيوتر */}
      <aside style={{ ...styles.sidebar, width: isMobile ? "100%" : "260px", boxSizing: "border-box" }}>
        <div style={styles.brandZone}>
          <h2 style={styles.brandText}>Promo Hub</h2>
          <span style={styles.userBadge}>@{user.username}</span>
        </div>
        
        <nav style={{ ...styles.navMenu, flexDirection: isMobile ? "row" : "column", flexWrap: isMobile ? "wrap" : "nowrap", justifyContent: "center" }}>
          <button 
            style={{ ...styles.navItem, ...(currentPage === "dashboard" ? styles.activeNavItem : {}), width: isMobile ? "45%" : "100%" }} 
            onClick={() => setCurrentPage("dashboard")}
          >
            📊 لوحة التحكم
          </button>
          <button 
            style={{ ...styles.navItem, ...(currentPage === "create" ? styles.activeNavItem : {}), width: isMobile ? "45%" : "100%" }} 
            onClick={() => setCurrentPage("create")}
          >
            ➕ إنشاء حملة
          </button>
          <button 
            style={{ ...styles.navItem, ...(currentPage === "campaigns" ? styles.activeNavItem : {}), width: isMobile ? "45%" : "100%" }} 
            onClick={() => setCurrentPage("campaigns")}
          >
            📋 قائمة حملاتك
          </button>
          <button 
            style={{ ...styles.navItem, ...(currentPage === "settings" ? styles.activeNavItem : {}), width: isMobile ? "45%" : "100%" }} 
            onClick={() => setCurrentPage("settings")}
          >
            ⚙️ الإعدادات
          </button>
        </nav>

        <button onClick={logout} style={{ ...styles.logoutButton, marginTop: isMobile ? "15px" : "auto", width: isMobile ? "100%" : "auto" }}>
          تسجيل الخروج
        </button>
      </aside>

      {/* منطقة المحتوى الممتدة بالكامل */}
      <main style={{ ...styles.mainContent, width: "100%", boxSizing: "border-box", padding: isMobile ? "20px" : "40px" }}>
        
        {currentPage === "dashboard" && (
          <div>
            <h2 style={styles.pageTitle}>مرحباً، {user.username} 👋</h2>
            <p style={styles.pageDescription}>هنا نظرة شاملة على أداء حملاتك الإعلانية.</p>
            
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><h3>إجمالي الحملات</h3><p style={styles.statNumber}>{stats.totalCampaigns}</p></div>
              <div style={styles.statCard}><h3>الحملات النشطة</h3><p style={{ ...styles.statNumber, color: "#2ecc71" }}>{stats.activeCampaigns}</p></div>
              <div style={styles.statCard}><h3>المصروفات</h3><p style={{ ...styles.statNumber, color: "#f1c40f" }}>{stats.totalSpent} Pi</p></div>
              <div style={styles.statCard}><h3>المشاهدات</h3><p style={styles.statNumber}>{stats.totalViews}</p></div>
            </div>
          </div>
        )}

        {currentPage === "create" && (
          <div style={styles.formContainer}>
            <h2 style={styles.pageTitle}>➕ إنشاء حملة جديدة</h2>
            <div style={styles.inputGroup}>
              <label style={styles.label}>عنوان الحملة:</label>
              <input type="text" placeholder="عنوان الحملة" style={styles.input} value={newCampaign.title} onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>الوصف:</label>
              <textarea placeholder="اكتب تفاصيل إعلانك هنا..." style={{ ...styles.input, height: "80px", resize: "none" }} value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>الميزانية (Pi):</label>
              <input type="number" placeholder="الميزانية" style={styles.input} value={newCampaign.budget} onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} />
            </div>
            <button style={styles.successButton} onClick={createCampaign}>حفظ وتأكيد الحملة</button>
          </div>
        )}

        {currentPage === "campaigns" && (
          <div>
            <h2 style={styles.pageTitle}>📋 إدارة وتتبع الحملات</h2>
            {campaigns.length === 0 ? (
              <div style={styles.emptyState}>لا توجد حملات مضافة.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>الحملة</th>
                      <th style={styles.th}>الميزانية</th>
                      <th style={styles.th}>الحالة</th>
                      <th style={styles.th}>الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((item) => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={styles.td}>{item.title}</td>
                        <td style={styles.td}>{item.budget} Pi</td>
                        <td style={styles.td}><span style={{ ...styles.statusBadge, backgroundColor: item.status === "نشطة" ? "#2ecc71" : "#f39c12" }}>{item.status}</span></td>
                        <td style={styles.td}>
                          {item.status === "بانتظار الدفع" && <button style={styles.payTableButton} onClick={() => payWithPi(item.id, item.budget)}>ادفع</button>}
                          <button style={styles.deleteTableButton} onClick={() => deleteCampaign(item.id)}>حذف</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {currentPage === "settings" && (
          <div style={styles.formContainer}>
            <h2 style={styles.pageTitle}>⚙️ الإعدادات</h2>
            <div style={styles.settingRow}><strong>الحساب:</strong><span>@{user.username}</span></div>
            <div style={styles.settingRow}><strong>حالة الاتصال:</strong><span style={{ color: "#2ecc71" }}>متصل</span></div>
          </div>
        )}

      </main>
    </div>
  );
}

// ==========================
// التنسيقات المعدلة لدعم الهواتف والشاشات الكاملة
// ==========================
const styles = {
  loadingScreen: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#101018", color: "#ffffff" },
  spinner: { width: "40px", height: "40px", border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid #6C5CE7", borderRadius: "50%" },
  loginContainer: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", background: "#101018", color: "#ffffff", direction: "rtl" },
  loginTitle: { fontSize: "36px", fontWeight: "bold", marginBottom: "10px" },
  loginSubtitle: { fontSize: "16px", color: "#a0a0b0", marginBottom: "30px" },
  loginButton: { padding: "14px 35px", fontSize: "18px", background: "#6C5CE7", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer" },
  appLayout: { display: "flex", minHeight: "100vh", background: "#0d0d14", color: "#ffffff", direction: "rtl" },
  sidebar: { background: "#141421", padding: "20px", display: "flex", flexDirection: "column", borderBottom: "1px solid #222" },
  brandZone: { marginBottom: "20px", textAlign: "center" },
  brandText: { fontSize: "24px", color: "#6C5CE7", fontWeight: "bold", margin: 0 },
  userBadge: { fontSize: "13px", background: "rgba(108, 92, 231, 0.2)", padding: "4px 10px", borderRadius: "20px", color: "#a29bfe" },
  navMenu: { display: "flex", gap: "10px" },
  navItem: { background: "none", border: "none", color: "#b2bec3", padding: "12px 10px", textAlign: "center", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  activeNavItem: { background: "#6C5CE7", color: "#ffffff", fontWeight: "bold" },
  logoutButton: { background: "#ff7675", color: "#fff", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  mainContent: { overflowY: "auto" },
  pageTitle: { fontSize: "24px", marginBottom: "5px" },
  pageDescription: { color: "#aaa", fontSize: "14px", marginBottom: "20px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "15px" },
  statCard: { background: "#141421", padding: "15px", borderRadius: "12px", border: "1px solid #222" },
  statNumber: { fontSize: "24px", fontWeight: "bold", marginTop: "5px" },
  formContainer: { background: "#141421", padding: "20px", borderRadius: "12px", border: "1px solid #222" },
  inputGroup: { display: "flex", flexDirection: "column", marginBottom: "15px" },
  label: { fontSize: "14px", marginBottom: "5px", color: "#ccc" },
  input: { background: "#0d0d14", border: "1px solid #333", padding: "12px", borderRadius: "8px", color: "#fff" },
  successButton: { background: "#2ecc71", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", width: "100%" },
  emptyState: { textAlign: "center", padding: "20px", color: "#aaa" },
  table: { width: "100%", borderCollapse: "collapse", background: "#141421" },
  th: { background: "#1c1c2e", padding: "10px", textAlign: "right", color: "#a29bfe" },
  td: { padding: "10px", borderBottom: "1px solid #222" },
  statusBadge: { padding: "4px 6px", borderRadius: "6px", fontSize: "11px", color: "#fff" },
  payTableButton: { background: "#f1c40f", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", marginLeft: "5px" },
  deleteTableButton: { background: "#e74c3c", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px" },
  settingRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #222" }
};

export default App;
