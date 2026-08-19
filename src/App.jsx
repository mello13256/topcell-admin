import { useEffect, useState } from "react";
import PinGate from "./components/PinGate";
import ProductList from "./components/ProductList";
import ProductForm from "./components/ProductForm";
import { ensureSignedIn } from "./lib/firebase";
import "./index.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [view, setView] = useState({ screen: "list" }); // { screen: 'list' } | { screen: 'form', product?: {...} }

  useEffect(() => {
    ensureSignedIn().then(() => setReady(true)).catch(() => setAuthError(true));
  }, []);

  if (authError) {
    return <div className="empty-state" style={{ padding: 40 }}>Não foi possível conectar. Verifique sua internet e reabra o app.</div>;
  }
  if (!ready) return null;

  return (
    <PinGate>
      {view.screen === "list" && (
        <ProductList
          onNew={() => setView({ screen: "form" })}
          onEdit={(p) => setView({ screen: "form", product: p })}
        />
      )}
      {view.screen === "form" && (
        <ProductForm
          existing={view.product}
          onDone={() => setView({ screen: "list" })}
          onCancel={() => setView({ screen: "list" })}
        />
      )}
    </PinGate>
  );
}
