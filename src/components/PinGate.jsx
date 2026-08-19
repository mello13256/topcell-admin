import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { APP_PIN } from "../lib/config";

const SESSION_KEY = "topcell_admin_unlocked";

export default function PinGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    Preferences.get({ key: SESSION_KEY }).then((res) => {
      if (res.value === "true") setUnlocked(true);
      setChecking(false);
    });
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (pin === APP_PIN) {
      setUnlocked(true);
      setError(false);
      Preferences.set({ key: SESSION_KEY, value: "true" });
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
