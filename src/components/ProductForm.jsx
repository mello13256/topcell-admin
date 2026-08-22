import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { supabase } from "../lib/supabase";
import { CATEGORIES } from "../lib/config";

const BLANK = {
  nome: "", categoria: "celulares", preco: "", variante: "",
  estoque: true, badge: "", foto_url: "", foto_path: "",
};

function base64ToBlob(base64, contentType) {
  const byteChars = atob(base64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
  return new Blob([byteArray], { type: contentType });
}

export default function ProductForm({ existing, onDone, onCancel }) {
  const [form, setForm] = useState(existing ? { ...BLANK, ...existing } : BLANK);
  const [photoPreview, setPhotoPreview] = useState(existing?.foto_url || null);
  const [photoFile, setPhotoFile] = useState(null); // { base64, contentType }
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function takePhoto(source) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source,
        quality: 70,
        width: 1000,
        correctOrientation: true,
      });
      const base64 = photo.base64String;
      const contentType = `image/${photo.format || "jpeg"}`;
      setPhotoPreview(`data:${contentType};base64,${base64}`);
      setPhotoFile({ base64, contentType });
    } catch (err) {
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
        const blob = base64ToBlob(photoFile.base64, photoFile.contentType);
        setUploadPct(45);
        const { error: uploadError } = await supabase.storage
          .from("produtos")
          .upload(filename, blob, { contentType: photoFile.contentType, upsert: true });
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
            {photoPreview ? <img src={photoPreview} alt="" /> : <span className="photo-placeholder">📷</span>}
          </div>
          <div className="photo-actions">
            <button type="button" className="btn-outline" onClick={() => takePhoto(CameraSource.Camera)}>Tirar foto</button>
            <button type="button" className="btn-outline" onClick={() => takePhoto(CameraSource.Photos)}>Galeria</button>
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
