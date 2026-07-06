import React, { useEffect, useState } from "react";

function App() {
  const [piReady, setPiReady] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("piUser");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("piUser");
      }
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

    script.onload = () => {
      initializePi();
    };

    script.onerror = () => {
      alert("تعذر تحميل Pi SDK");
      setLoading(false);
    };

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

      console.log("Pi SDK Ready");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  async function login() {
    if (!piReady) {
      alert("يرجى الانتظار حتى تكتمل تهيئة Pi SDK");
      return;
    }

    try {
      const auth = await window.Pi.authenticate(
        ["username", "payments"],
        onIncompletePaymentFound
      );

      setUser(auth.user);

      localStorage.setItem(
        "piUser",
        JSON.stringify(auth.user)
      );

      alert("مرحباً " + auth.user.username);

    } catch (error) {
      console.error(error);
      alert("فشل تسجيل الدخول");
    }
  }

  function logout() {
    localStorage.removeItem("piUser");
    setUser(null);
  }

  function onIncompletePaymentFound(payment) {
    console.log("Incomplete Payment:", payment);
  }

  if (loading) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Loading Pi SDK...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
        textAlign: "center"
      }}
    >
      <h1>Smart Promo Hub</h1>

      {user ? (
        <>
          <h2>مرحباً {user.username}</h2>

          <p>تم تسجيل الدخول بنجاح.</p>

          <button
            onClick={logout}
            style={{
              padding: "12px 24px",
              cursor: "pointer"
            }}
          >
            تسجيل الخروج
          </button>
        </>
      ) : (
        <>
          <p>قم بتسجيل الدخول باستخدام Pi Network.</p>

          <button
            onClick={login}
            disabled={!piReady}
            style={{
              padding: "12px 24px",
              cursor: "pointer"
            }}
          >
            تسجيل الدخول باستخدام Pi
          </button>
        </>
      )}
    </div>
  );
}

export default App;
