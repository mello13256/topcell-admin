import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "../lib/supabase";
import { CATEGORIES } from "../lib/config";

const BLANK = {
  nome: "", categoria: "celulares", preco: "", variante: "",
  estoque: true, badge: "", foto_url: "", foto_path: "",
};

// Redimensiona e recomprime a foto no próprio aparelho antes de subir.
// A foto original (que pode vir bem pesada da câmera) nunca é enviada
// nem guardada — só essa versão comprimida, o que economiza MUITO
// espaço na cota gratuita de armazenamento.
const MAX_WIDTH = 900;
const JPEG_QUALITY = 0.62;

function compressImage(base64, contentType) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao comprimir a imagem"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => reject(new Error("Falha ao carregar a imagem pra compressão"));
    img.src = `data:${contentType};base64,${base64}`;
  });
}

export default function ProductForm({ existing, onDone, onCancel }) {
  const [form, setForm] = useState(existing ? { ...BLANK, ...existing } : BLANK);
  const [photoPreview, setPhotoPreview] = useState(existing?.foto_url || null);
  const [photoFile, setPhotoFile] = useState(null); // Blob já comprimido, pronto pra subir
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function takePhoto(source) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source,
        quality: 85,
        correctOrientation: true,
      });
      const rawBase64 = photo.base64String;
      const rawContentType = `image/${photo.format || "jpeg"}`;

      setCompressing(true);
      // Comprime/redimensiona aqui; a foto "crua" (rawBase64) some da
      // memória depois disso e nunca é enviada pro servidor.
      const compressedBlob = await compressImage(rawBase64, rawContentType);
      setCompressing(false);

      setPhotoPreview(URL.createObjectURL(compressedBlob));
      setPhotoFile(compressedBlob);
    } catch (err) {
      setCompressing(false);
      // usuário cancelou a captura — não é erro
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!form.nome.trim()) { setErrorMsg("Dá um nome pro produto."); return; }
    if (!form.preco.toString().trim()) { setErrorMsg("Coloca o preço."); return; }

    setSaving(true);
    try {
      let foto_url = form.foto_url;
      let foto_path = form.foto_path;

      if (photoFile) {
        setUploadPct(15);
        // apaga foto antiga se estava trocando
        if (foto_path) {
          supabase.storage.from("produtos").remove([foto_path]).catch(() => {});
        }
        const filename = `${Date.now()}.jpg`;
        setUploadPct(45);
        const { error: uploadError } = await supabase.storage
          .from("produtos")
          .upload(filename, photoFile, { contentType: "image/jpeg", upsert: true });
        if (uploadError) throw uploadError;
        setUploadPct(85);
        const { data: publicUrlData } = supabase.storage.from("produtos").getPublicUrl(filename);
        foto_url = publicUrlData.publicUrl;
        foto_path = filename;
        setUploadPct(100);
      }

      const payload = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        preco: form.preco.toString().trim(),
        variante: form.variante.trim(),
        estoque: !!form.estoque,
        badge: form.badge.trim(),
        foto_url,
        foto_path,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { error } = await supabase.from("produtos").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produtos").insert(payload);
        if (error) throw error;
      }
      onDone();
    } catch (err) {
      setErrorMsg("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
      setUploadPct(null);
    }
  }

  return (
    <div className="form-screen">
      <div className="form-header">
        <button className="icon-back" onClick={onCancel}>‹</button>
        <h2>{existing ? "Editar produto" : "Novo produto"}</h2>
      </div>

      <form onSubmit={handleSave} className="product-form">
        <div className="photo-picker">
          <div className="photo-preview">
            {compressing ? (
              <span className="photo-placeholder">⏳</span>
            ) : photoPreview ? (
              <img src={photoPreview} alt="" />
            ) : (
              <span className="photo-placeholder">📷</span>
            )}
          </div>
          <div className="photo-actions">
            <button type="button" className="btn-outline" disabled={compressing} onClick={() => takePhoto(CameraSource.Camera)}>Tirar foto</button>
            <button type="button" className="btn-outline" disabled={compressing} onClick={() => takePhoto(CameraSource.Photos)}>Galeria</button>
          </div>
        </div>

        <label className="field-label">Nome do produto</label>
        <input className="field-input" value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex: iPhone 15 Pro" />

        <label className="field-label">Categoria</label>
        <select className="field-input" value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <label className="field-label">Preço (R$)</label>
        <input className="field-input" inputMode="decimal" value={form.preco} onChange={(e) => set("preco", e.target.value)} placeholder="Ex: 1.299,00" />

        <label className="field-label">Variante / detalhe (opcional)</label>
        <input className="field-input" value={form.variante} onChange={(e) => set("variante", e.target.value)} placeholder="Ex: 128GB, Preto" />

        <label className="field-label">Selo (opcional)</label>
        <input className="field-input" value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Ex: NOVO, PROMOÇÃO" />

        <label className="switch-row">
          <span>Em estoque</span>
          <input type="checkbox" checked={form.estoque} onChange={(e) => set("estoque", e.target.checked)} />
        </label>

        {errorMsg && <div className="form-error">{errorMsg}</div>}
        {uploadPct !== null && <div className="upload-bar"><div style={{ width: uploadPct + "%" }} /></div>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar produto"}
        </button>
      </form>
    </div>
  );
}
