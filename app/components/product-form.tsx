"use client";

import { useActionState } from "react";
import {
  AI_TOOLS,
  CATEGORIES,
  displayCategory,
  fromStoredList,
  type ProductFormState,
} from "@/app/lib/product-shared";

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
};

export function ProductForm({ action, buttonLabel, draft }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const selectedTools = new Set(fromStoredList(draft?.tools));

  return (
    <form className="form-grid" action={formAction}>
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
              <label htmlFor="logoUrl">Logo *</label>
              <input className="input" id="logoUrl" name="logoUrl" type="url" defaultValue={draft?.logoUrl ?? ""} required placeholder="https://example.com/logo.png" />
            </div>
            <div className="field">
              <label htmlFor="demoVideoUrl">演示视频</label>
              <input className="input" id="demoVideoUrl" name="demoVideoUrl" type="url" defaultValue={draft?.demoVideoUrl ?? ""} placeholder="可选" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="imageUrls">截图 *</label>
            <textarea className="input" id="imageUrls" name="imageUrls" defaultValue={fromStoredList(draft?.imageUrls).join("\n")} required placeholder={"https://example.com/screenshot-1.png\nhttps://example.com/screenshot-2.png"} />
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>每行一个链接，最多 5 张</span>
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
