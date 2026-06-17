"use client";

import { useRef, useState } from "react";
import { useActionState } from "react";
import {
  AI_TOOLS,
  CATEGORIES,
  displayCategory,
  fromStoredList,
  type ProductFormState,
} from "@/app/lib/product-shared";
import { useFormDraft } from "@/app/hooks/use-form-draft";

type ProductDraftLike = {
  name: string;
  tagline: string;
  websiteUrl: string;
  logoUrl: string;
  imageUrls: string;
  demoVideoUrl: string | null;
  category: string;
  tags: string;
  tools: string;
  buildStory: string;
};

type ProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  buttonLabel: string;
  draft?: ProductDraftLike | null;
  enableDraft?: boolean;
};

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "上传失败");
  return data.url;
}

export function ProductForm({ action, buttonLabel, draft, enableDraft }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const selectedTools = new Set(fromStoredList(draft?.tools));

  const formRef = useRef<HTMLFormElement>(null);

  const [logoPreview, setLogoPreview] = useState(draft?.logoUrl ?? "");
  const [imagePreviews, setImagePreviews] = useState<string[]>(() => {
    const stored = draft?.imageUrls;
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter((s: unknown) => typeof s === "string");
    } catch {}
    return stored.split("\n").filter(Boolean);
  });
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoUrlInputRef = useRef<HTMLInputElement>(null);
  const imageUrlInputRef = useRef<HTMLTextAreaElement>(null);

  const { clearDraft } = useFormDraft({
    enabled: enableDraft === true && !draft,
    formRef,
    logoUrlInputRef,
    imageUrlInputRef,
    logoPreview,
    imagePreviews,
    setLogoPreview,
    setImagePreviews,
  });

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setLogoPreview(url);
      if (logoUrlInputRef.current) logoUrlInputRef.current.value = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "上传失败");
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const remaining = 5 - imagePreviews.length;
      const toUpload = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(toUpload.map(uploadFile));
      const next = [...imagePreviews, ...urls];
      setImagePreviews(next);
      if (imageUrlInputRef.current) imageUrlInputRef.current.value = next.join("\n");
    } catch (err) {
      alert(err instanceof Error ? err.message : "上传失败");
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    const next = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(next);
    if (imageUrlInputRef.current) imageUrlInputRef.current.value = next.join("\n");
  }

  return (
    <form ref={formRef} className="form-grid" action={formAction} onSubmit={() => clearDraft()}>
      {state.error && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 12,
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
          color: 'var(--red)',
          fontSize: 13,
          fontWeight: 500,
        }}>
          {state.error}
        </div>
      )}

      <div className="form-section">
        <div className="form-section-title">
          <span className="number">01</span>
          <span className="text">产品信息</span>
          <span className="line" />
        </div>
        <div className="form-grid">
          <div className="form-row">
            <div className="field">
              <label htmlFor="name">产品名称 *</label>
              <input className="input" id="name" name="name" defaultValue={draft?.name ?? ""} required maxLength={80} placeholder="给产品起个名字" />
            </div>
            <div className="field">
              <label htmlFor="websiteUrl">产品链接 *</label>
              <input className="input" id="websiteUrl" name="websiteUrl" type="url" defaultValue={draft?.websiteUrl ?? ""} required placeholder="https://" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="tagline">一句话介绍 *</label>
            <input className="input" id="tagline" name="tagline" defaultValue={draft?.tagline ?? ""} required maxLength={160} placeholder="用一句话描述你的产品" />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="category">分类 *</label>
              <select className="input" id="category" name="category" defaultValue={draft?.category ?? ""} required>
                <option value="" disabled>请选择</option>
                {CATEGORIES.map((category) => (
                  <option value={category} key={category}>{displayCategory(category)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tags">标签</label>
              <input className="input" id="tags" name="tags" defaultValue={fromStoredList(draft?.tags).join(", ")} placeholder="AI, 效率工具, 学生项目" />
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <span className="number">02</span>
          <span className="text">视觉素材</span>
          <span className="line" />
        </div>
        <div className="form-grid">
          <div className="form-row">
            <div className="field">
              <label>Logo *</label>
              {logoPreview && (
                <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                  <img src={logoPreview} alt="Logo preview" style={{ height: 48, borderRadius: 8, objectFit: 'contain', background: 'var(--bg-surface)', padding: 4 }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => logoInputRef.current?.click()} disabled={uploading} style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0 }}>
                  {uploading ? "上传中..." : "选择文件"}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                <input ref={logoUrlInputRef} className="input" name="logoUrl" type="url" defaultValue={draft?.logoUrl ?? ""} required placeholder="或输入图片链接" style={{ flex: 1 }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>支持 PNG、JPG、WebP，最大 5MB</span>
            </div>
            <div className="field">
              <label htmlFor="demoVideoUrl">演示视频</label>
              <input className="input" id="demoVideoUrl" name="demoVideoUrl" type="url" defaultValue={draft?.demoVideoUrl ?? ""} placeholder="可选" />
            </div>
          </div>
          <div className="field">
            <label>截图 *（最多 5 张）</label>
            {imagePreviews.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {imagePreviews.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt={`Screenshot ${i + 1}`} style={{ height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {imagePreviews.length < 5 && (
                <>
                  <button type="button" className="btn-secondary" onClick={() => imageInputRef.current?.click()} disabled={uploading} style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0 }}>
                    {uploading ? "上传中..." : "选择文件"}
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                </>
              )}
              <textarea ref={imageUrlInputRef} className="input" name="imageUrls" defaultValue={fromStoredList(draft?.imageUrls).join("\n")} required placeholder={"或每行输入一个图片链接"} style={{ flex: 1, minHeight: 60 }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>可混合使用：上传文件 + 粘贴链接，每行一个链接</span>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <span className="number">03</span>
          <span className="text">构建详情</span>
          <span className="line" />
        </div>
        <div className="form-grid">
          <div className="field">
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>使用的 AI coding 工具</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {AI_TOOLS.map((tool) => (
                <label key={tool} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--t2)',
                  transition: 'all 0.2s',
                }}>
                  <input type="checkbox" name="tools" value={tool} defaultChecked={selectedTools.has(tool)} />
                  {tool}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="buildStory">构建故事 *</label>
            <textarea className="input" id="buildStory" name="buildStory" defaultValue={draft?.buildStory ?? ""} required maxLength={1000} placeholder="你用了哪些工具？花了多久？AI 帮你完成了哪些部分？" style={{ minHeight: 150 }} />
          </div>
        </div>
      </div>

      <button className="btn-primary" type="submit" disabled={pending} style={{ width: '100%', justifyContent: 'center', padding: '14px 24px' }}>
        {pending ? "保存中..." : buttonLabel}
      </button>
    </form>
  );
}
