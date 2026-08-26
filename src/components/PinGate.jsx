import { useEffect, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { APP_PIN } from "../lib/config";

// Guarda o momento da última atividade (não um simples "logado sim/não").
// Se o app ficar 20 minutos sem nenhum toque/clique, a sessão expira e
// pede o PIN de novo — mesmo que a pessoa não tenha fechado o app.
const LAST_ACTIVITY_KEY = "topcell_admin_last_activity";
const SESSION_MS = 20 * 60 * 1000; // 20 minutos

export default function PinGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const lastPersistRef = useRef(0);

  function persistNow(now) {
    lastActivityRef.current = now;
    lastPersistRef.current = now;
    Preferences.set({ key: LAST_ACTIVITY_KEY, value: String(now) });
  }

  function markActivity() {
    const now = Date.now();
    lastActivityRef.current = now;
    // grava no armazenamento no máximo a cada 15s (não precisa gravar
    // a cada toque — só precisa estar razoavelmente atualizado pra
    // sobreviver a um fechamento/reabertura do app)
    if (now - lastPersistRef.current > 15000) {
      lastPersistRef.current = now;
      Preferences.set({ key: LAST_ACTIVITY_KEY, value: String(now) });
    }
  }

  function lockNow() {
    setUnlocked(false);
    Preferences.remove({ key: LAST_ACTIVITY_KEY });
  }

  // Ao abrir o app: confere se a última atividade foi há menos de
  // 20 minutos. Se foi, entra direto sem pedir PIN.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await Preferences.get({ key: LAST_ACTIVITY_KEY });
      const stored = res.value ? parseInt(res.value, 10) : 0;
      const now = Date.now();
      if (stored && now - stored <= SESSION_MS) {
        if (!cancelled) {
          persistNow(now);
          setUnlocked(true);
        }
      }
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Enquanto estiver desbloqueado: qualquer toque/clique/tecla renova
  // os 20 minutos. Um relógio confere a cada 15s se passou do tempo
  // (e confere de novo quando o app volta a ficar em primeiro plano,
  // já que o sistema pode pausar timers com o app em segundo plano).
  useEffect(() => {
    if (!unlocked) return;

    const onActivity = () => markActivity();
    const events = ["pointerdown", "keydown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_MS) lockNow();
    }, 15000);

    function onVisibility() {
      if (document.visibilityState === "visible" && Date.now() - lastActivityRef.current > SESSION_MS) {
        lockNow();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearInterval(checkInterval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [unlocked]);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === APP_PIN) {
      persistNow(Date.now());
      setUnlocked(true);
      setError(false);
      setPin("");
    } else {
      setError(true);
      setPin("");
    }
  }

  if (checking) return null;
  if (unlocked) return children;

  return (
    <div className="pin-screen">
      <div className="pin-card">
        <div className="pin-logo">TOP CELL</div>
        <p className="pin-sub">Digite o PIN da loja</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            className={"pin-input" + (error ? " pin-input-error" : "")}
            placeholder="••••"
            maxLength={8}
          />
          {error && <div className="pin-error">PIN incorreto, tenta de novo.</div>}
          <button type="submit" className="pin-btn">Entrar</button>
        </form>
      </div>
    </div>
  );
}
