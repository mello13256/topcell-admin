import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CATEGORIES } from "../lib/config";

export default function ProductList({ onEdit, onNew }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();

    // Realtime: qualquer mudança na tabela (de qualquer funcionário,
    // em qualquer aparelho) atualiza a lista na hora.
    const channel = supabase
      .channel("produtos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function toggleStock(p) {
    await supabase.from("produtos").update({ estoque: !p.estoque }).eq("id", p.id);
  }

  async function handleDelete(p) {
    await supabase.from("produtos").delete().eq("id", p.id);
    if (p.foto_path) {
      supabase.storage.from("produtos").remove([p.foto_path]).catch(() => {});
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
              {p.foto_url ? <img src={p.foto_url} alt="" /> : <span>{catIcon(p.categoria)}</span>}
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
              <button className="row-delete" onClick={() => setConfirmDelete(p)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
                  <line x1="15.5" y1="8.5" x2="8.5" y2="15.5"/>
                </svg>
              </button>
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
