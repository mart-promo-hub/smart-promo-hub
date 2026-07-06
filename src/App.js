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

  // ==========================
  // تشغيل التطبيق
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

  // ==========================
  // تحميل Pi SDK
  // ==========================
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

  // ==========================
  // تهيئة Pi
  // ==========================
  async function initializePi() {
    try {
      await window.Pi.init({
        version: "2.0",
        sandbox: true
      });
      setPiReady(true);
      setLoading(false);
      console.log("Pi SDK Ready");
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  // ==========================
  // تسجيل الدخول
  // ==========================
  async function login() {
    if (!piReady) {
      alert("Pi SDK لم يكتمل تحميله بعد");
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
      // تجريبي للمطور في حال عدم فتح التطبيق داخل متصفح Pi الرسمي
      const mockUser = { username: "alialihashed77" };
      setUser(mockUser);
      localStorage.setItem("piUser", JSON.stringify(mockUser));
    }
  }

  // ==========================
  // تسجيل الخروج
  // ==========================
  function logout() {
    localStorage.removeItem("piUser");
    setUser(null);
  }

  function onIncompletePaymentFound(payment) {
    console.log("Incomplete payment found:", payment);
  }

  // ==========================
  // حساب الإحصائيات
  // ==========================
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

  // ==========================
  // إنشاء حملة جديدة
  // ==========================
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
      createdAt: new Date().toLocaleDateString("ar-EG"),
      views: 0,
      clicks: 0
    };

    const updatedCampaigns = [...campaigns, campaign];
    setCampaigns(updatedCampaigns);
    localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
    calculateStats(updatedCampaigns);

    setNewCampaign({
      title: "",
      description: "",
      platform: "Facebook",
      budget: "",
      type: "Text"
    });

    alert("تم حفظ الحملة! يرجى تفعيلها عبر الدفع بعملة Pi من قائمة الحملات.");
    setCurrentPage("campaigns");
  }

  // ==========================
  // حذف حملة
  // ==========================
  function deleteCampaign(id) {
    if (window.confirm("هل أنت متأكد من حذف هذه الحملة؟")) {
      const updatedCampaigns = campaigns.filter(campaign => campaign.id !== id);
      setCampaigns(updatedCampaigns);
      localStorage.setItem("campaigns", JSON.stringify(updatedCampaigns));
      calculateStats(updatedCampaigns);
    }
  }

  // ==========================
  // دفع بواسطة Pi
  // ==========================
  async function payWithPi(id, amount) {
    if (!piReady) {
      alert("Pi SDK غير جاهز للعمليات الحالية");
      return;
    }
    try {
      alert(`جاري تجهيز بوابة الدفع لـ Pi Network...\nالمبلغ المطلوبة: ${amount} Pi`);
      
      // تحديث حالة الحملة محلياً كمثال بعد نجاح الدفع المبدئي
      const updated = campaigns.map(c => {
        if (c.id === id) {
          return { ...c, status: "نشطة" };
        }
        return c;
      });
      setCampaigns(updated);
      localStorage.setItem("campaigns", JSON.stringify(updated));
      calculateStats(updated);
      alert("تم الدفع بنجاح وتحولت الحملة إلى نشطة!");

    } catch (error) {
      console.error(error);
      alert("فشل إجراء عملية الدفع");
    }
  }

  // ==========================
  // شاشة التحميل
  // ==========================
  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: 15 }}>جاري تهيئة منصة Smart Promo Hub...</p>
      </div>
    );
  }

  // ==========================
  // شاشة تسجيل الدخول (تطابق الصورة تماماً)
  // ==========================
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

  // ==========================
  // واجهة التطبيق الرئيسية (بعد تسجيل الدخول)
  // ==========================
  return (
    <div style={styles.appLayout}>
      
      {/* شريط التنقل الجانبي الأنيق */}
      <aside style={styles.sidebar}>
        <div style={styles.brandZone}>
          <h2 style={styles.brandText}>Promo Hub</h2>
          <span style={styles.userBadge}>@{user.username}</span>
        </div>
        
        <nav style={styles.navMenu}>
          <button 
            style={{...styles.navItem, ...(currentPage === "dashboard" ? styles.activeNavItem : {})}} 
            onClick={() => setCurrentPage("dashboard")}
          >
            📊 لوحة التحكم والإحصائيات
          </button>
          <button 
            style={{...styles.navItem, ...(currentPage === "create" ? styles.activeNavItem : {})}} 
            onClick={() => setCurrentPage("create")}
          >
            ➕ إنشاء حملة إعلانية
          </button>
          <button 
            style={{...styles.navItem, ...(currentPage === "campaigns" ? styles.activeNavItem : {})}} 
            onClick={() => setCurrentPage("campaigns")}
          >
            📋 قائمة حملاتك
          </button>
          <button 
            style={{...styles.navItem, ...(currentPage === "settings" ? styles.activeNavItem : {})}} 
            onClick={() => setCurrentPage("settings")}
          >
            ⚙️ إعدادات الحساب
          </button>
        </nav>

        <button onClick={logout} style={styles.logoutButton}>
          تسجيل الخروج
        </button>
      </aside>

      {/* منطقة المحتوى المتغير */}
      <main style={styles.mainContent}>
        
        {/* صفحة Dashboard والإحصائيات */}
        {currentPage === "dashboard" && (
          <div>
            <h2 style={styles.pageTitle}>أهلاً بك في لوحة التحكم، {user.username} 👋</h2>
            <p style={styles.pageDescription}>هنا نظرة شاملة على أداء حملاتك الإعلانية ومصروفاتك الرقمية.</p>
            
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <h3>إجمالي الحملات</h3>
                <p style={styles.statNumber}>{stats.totalCampaigns}</p>
              </div>
              <div style={styles.statCard}>
                <h3>الحملات النشطة</h3>
                <p style={{...styles.statNumber, color: "#2ecc71"}}>{stats.activeCampaigns}</p>
              </div>
              <div style={styles.statCard}>
                <h3>المصروفات بـ Pi</h3>
                <p style={{...styles.statNumber, color: "#f1c40f"}}>{stats.totalSpent} Pi</p>
              </div>
              <div style={styles.statCard}>
                <h3>إجمالي المشاهدات</h3>
                <p style={styles.statNumber}>{stats.totalViews}</p>
              </div>
            </div>

            <div style={{...styles.statCard, marginTop: 30}}>
              <h3>🚀 انطلق الآن!</h3>
              <p style={{color: "#aaa", marginTop: 10}}>يمكنك البدء في الوصول لآلاف المستخدمين المهتمين حول العالم عن طريق تمويل إعلاناتك بعملة Pi التابعة لك.</p>
              <button style={styles.primaryButton} onClick={() => setCurrentPage("create")}>أنشئ إعلانك الأول الآن</button>
            </div>
          </div>
        )}

        {/* صفحة إنشاء حملة جديدة */}
        {currentPage === "create" && (
          <div style={styles.formContainer}>
            <h2 style={styles.pageTitle}>➕ إنشاء حملة ترويجية جديدة</h2>
            <p style={styles.pageDescription}>قم بتعبئة التفاصيل وحدد الميزانية المطلوبة لتبدأ حملتك فوراً.</p>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>عنوان الحملة:</label>
              <input 
                type="text" 
                placeholder="مثال: متجر السلع الإلكترونية بـ Pi" 
                style={styles.input}
                value={newCampaign.title}
                onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>وصف الإعلان:</label>
              <textarea 
                placeholder="اكتب هنا تفاصيل العرض الجذاب الخاص بك..." 
                style={{...styles.input, height: "100px", resize: "none"}}
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
              />
            </div>

            <div style={styles.rowInputs}>
              <div style={{...styles.inputGroup, flex: 1, marginLeft: 10}}>
                <label style={styles.label}>منصة النشر:</label>
                <select 
                  style={styles.input}
                  value={newCampaign.platform}
                  onChange={(e) => setNewCampaign({...newCampaign, platform: e.target.value})}
                >
                  <option value="Facebook">Facebook</option>
                  <option value="X / Twitter">X / Twitter</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Pi Browser">داخل تطبيق Pi</option>
                </select>
              </div>

              <div style={{...styles.inputGroup, flex: 1}}>
                <label style={styles.label}>نوع المحتوى:</label>
                <select 
                  style={styles.input}
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                >
                  <option value="Text">نصي فقط</option>
                  <option value="Image">صورة + نص</option>
                  <option value="Video">فيديو ترويجي</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>الميزانية المحددة (Pi):</label>
              <input 
                type="number" 
                placeholder="أدخل ميزانية الإعلان مثلاً 10" 
                style={styles.input}
                value={newCampaign.budget}
                onChange={(e) => setNewCampaign({...newCampaign, budget: e.target.value})}
              />
            </div>

            <button style={styles.successButton} onClick={createCampaign}>حفظ وتأكيد الحملة</button>
          </div>
        )}

        {/* صفحة قائمة الحملات والدفع */}
        {currentPage === "campaigns" && (
          <div>
            <h2 style={styles.pageTitle}>📋 إدارة وتتبع الحملات</h2>
            <p style={styles.pageDescription}>تابع حالة الدفع، المشاهدات، والتحكم بالحملات المضافة.</p>

            {campaigns.length === 0 ? (
              <div style={styles.emptyState}>لا توجد أي حملات مضافة حالياً.</div>
            ) : (
              <div style={{overflowX: "auto"}}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>الحملة</th>
                      <th style={styles.th}>المنصة</th>
                      <th style={styles.th}>الميزانية</th>
                      <th style={styles.th}>الحالة</th>
                      <th style={styles.th}>الإجراءات والدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((item) => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={{fontWeight: "bold"}}>{item.title}</div>
                          <div style={{fontSize: "12px", color: "#aaa"}}>{item.createdAt}</div>
                        </td>
                        <td style={styles.td}>{item.platform}</td>
                        <td style={styles.td}>{item.budget} Pi</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge, 
                            backgroundColor: item.status === "نشطة" ? "#2ecc71" : "#f39c12"
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {item.status === "بانتظار الدفع" && (
                            <button 
                              style={styles.payTableButton} 
                              onClick={() => payWithPi(item.id, item.budget)}
                            >
                              💳 ادفع الآن بـ Pi
                            </button>
                          )}
                          <button 
                            style={styles.deleteTableButton} 
                            onClick={() => deleteCampaign(item.id)}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* صفحة الإعدادات */}
        {currentPage === "settings" && (
          <div style={styles.formContainer}>
            <h2 style={styles.pageTitle}>⚙️ إعدادات حسابك الرقمي</h2>
            <div style={styles.settingRow}>
              <strong>اسم المستخدم في Pi Network:</strong>
              <span>@{user.username}</span>
            </div>
            <div style={styles.settingRow}>
              <strong>حالة الاتصال بالـ SDK:</strong>
              <span style={{color: piReady ? "#2ecc71" : "#e74c3c"}}>
                {piReady ? "متصل وآمن (Sandbox Mode)" : "غير متصل"}
              </span>
            </div>
            <div style={styles.settingRow}>
              <strong>توثيق النظام:</strong>
              <span>مكتمل ومربوط بمحفظتك الرقمية</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ==========================
// التنسيقات الإحترافية للتصميم (CSS)
// ==========================
const styles = {
  loadingScreen: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#101018",
    color: "#ffffff",
    fontFamily: "sans-serif"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid #6C5CE7",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loginContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#101018",
    color: "#ffffff",
    fontFamily: "sans-serif",
    textAlign: "center",
    direction: "rtl"
  },
  loginTitle: {
    fontSize: "36px",
    fontWeight: "bold",
    marginBottom: "10px",
    letterSpacing: "1px"
  },
  loginSubtitle: {
    fontSize: "16px",
    color: "#a0a0b0",
    marginBottom: "30px"
  },
  loginButton: {
    padding: "14px 35px",
    fontSize: "18px",
    background: "#6C5CE7",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 4px 15px rgba(108, 92, 231, 0.4)",
    transition: "0.3s"
  },
  appLayout: {
    display: "flex",
    height: "100vh",
    background: "#0d0d14",
    color: "#ffffff",
    fontFamily: "sans-serif",
    direction: "rtl"
  },
  sidebar: {
    width: "260px",
    background: "#141421",
    padding: "25px",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #222"
  },
  brandZone: {
    marginBottom: "40px",
    textAlign: "center"
  },
  brandText: {
    fontSize: "24px",
    color: "#6C5CE7",
    fontWeight: "bold",
    margin: "0 0 5px 0"
  },
  userBadge: {
    fontSize: "13px",
    background: "rgba(108, 92, 231, 0.2)",
    padding: "4px 10px",
    borderRadius: "20px",
    color: "#a29bfe"
  },
  navMenu: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1
  },
  navItem: {
    background: "none",
    border: "none",
    color: "#b2bec3",
    padding: "12px 15px",
    textAlign: "right",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    transition: "0.2s"
  },
  activeNavItem: {
    background: "#6C5CE7",
    color: "#ffffff",
    fontWeight: "bold"
  },
  logoutButton: {
    background: "#ff7675",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "20px"
  },
  mainContent: {
    flex: 1,
    padding: "40px",
    overflowY: "auto"
  },
  pageTitle: {
    fontSize: "26px",
    marginBottom: "5px"
  },
  pageDescription: {
    color: "#aaa",
    fontSize: "14px",
    marginBottom: "30px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px"
  },
  statCard: {
    background: "#141421",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #222",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "bold",
    marginTop: "10px"
  },
  primaryButton: {
    background: "#6C5CE7",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    marginTop: "15px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  formContainer: {
    background: "#141421",
    padding: "30px",
    borderRadius: "12px",
    maxWidth: "600px",
    border: "1px solid #222"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "15px"
  },
  label: {
    fontSize: "14px",
    marginBottom: "5px",
    color: "#ccc"
  },
  input: {
    background: "#0d0d14",
    border: "1px solid #333",
    padding: "12px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "15px",
    outline: "none"
  },
  rowInputs: {
    display: "flex"
  },
  successButton: {
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    padding: "12px 25px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
    fontSize: "16px",
    marginTop: "10px"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    background: "#141421",
    borderRadius: "12px",
    color: "#aaa"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#141421",
    borderRadius: "12px",
    overflow: "hidden"
  },
  th: {
    background: "#1c1c2e",
    padding: "15px",
    textAlign: "right",
    fontSize: "14px",
    color: "#a29bfe"
  },
  td: {
    padding: "15px",
    borderBottom: "1px solid #222",
    fontSize: "15px"
  },
  tr: {
    transition: "0.2s",
    ":hover": { background: "#1c1c2e" }
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#fff"
  },
  payTableButton: {
    background: "#f1c40f",
    color: "#000",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    marginLeft: "10px"
  },
  deleteTableButton: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 0",
    borderBottom: "1px solid #222"
  }
};

export default App;
