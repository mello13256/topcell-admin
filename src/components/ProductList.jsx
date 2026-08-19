import { useEffect, useState } from "react";
import { collection, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { CATEGORIES } from "../lib/config";

export default function ProductList({ onEdit, onNew }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "produtos"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  async function toggleStock(p) {
    await updateDoc(doc(db, "produtos", p.id), { estoque: !p.estoque });
  }

  async function handleDelete(p) {
    await deleteDoc(doc(db, "produtos", p.id));
    if (p.fotoPath) {
      deleteObject(ref(storage, p.fotoPath)).catch(() => {});
    }
    setConfirmDelete(null);
  }

  const filtered = products.filter((p) =>
    p.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="list-screen">
      <div className="list-header">
        <div className="list-title">TOP CELL <span>· gerenciar</span></div>
        <button className="btn-add" onClick={onNew}>+ Novo</button>
      </div>

      <input
        className="search-input"
        placeholder="Buscar produto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div className="empty-state">Carregando...</div>}
      {!loading && filtered.length === 0 && <div className="empty-state">Nenhum produto cadastrado ainda.</div>}

      <div className="product-rows">
        {filtered.map((p) => (
          <div key={p.id} className={"product-row" + (p.estoque ? "" : " out")}>
            <div className="row-thumb">
              {p.fotoUrl ? <img src={p.fotoUrl} alt="" /> : <span>{catIcon(p.categoria)}</span>}
            </div>
            <div className="row-info" onClick={() => onEdit(p)}>
              <div className="row-name">{p.nome}</div>
              <div className="row-meta">{CATEGORIES.find((c) => c.value === p.categoria)?.label || p.categoria} · R$ {p.preco}</div>
            </div>
            <div className="row-actions">
              <label className="mini-switch">
                <input type="checkbox" checked={!!p.estoque} onChange={() => toggleStock(p)} />
                <span>{p.estoque ? "Em estoque" : "Esgotado"}</span>
              </label>
              <button className="row-delete" onClick={() => setConfirmDelete(p)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p>Excluir "{confirmDelete.nome}"? Essa ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmDelete)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function catIcon(cat) {
  const map = { celulares: "📱", servicos: "🛠️", acessorios: "🎧", outros: "📦" };
  return map[cat] || "📦";
}
