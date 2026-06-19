import assert from "node:assert/strict";
import test from "node:test";
import {
  parseProductForm,
  pendingReviewProductWhere,
  publishedProductWhere,
  isUniqueConstraintOn,
  slugCandidate,
  statusAfterDraftSubmission,
} from "../app/lib/products";

function validFormData() {
  const formData = new FormData();
  formData.set("name", "VibePKU");
  formData.set("tagline", "A curated gallery for AI-built products.");
  formData.set("websiteUrl", "https://example.com");
  formData.set("logoUrl", "/uploads/logo.png");
  formData.set("imageUrls", "https://example.com/screen.png\n/uploads/screen.webp");
  formData.set("demoVideoUrl", "");
  formData.set("category", "Dev Tools");
  formData.set("tags", "AI, PKU, Products");
  formData.append("tools", "Cursor");
  formData.append("tools", "Claude Code");
  formData.set("buildStory", "Built with AI coding tools and reviewed by the team.");
  return formData;
}

test("parseProductForm returns normalized values for a valid submission", () => {
  const parsed = parseProductForm(validFormData());

  assert.notEqual(typeof parsed, "string");
  assert.deepEqual(parsed, {
    name: "VibePKU",
    tagline: "A curated gallery for AI-built products.",
    websiteUrl: "https://example.com",
    logoUrl: "/uploads/logo.png",
    imageUrls: ["https://example.com/screen.png", "/uploads/screen.webp"],
    demoVideoUrl: null,
    category: "Dev Tools",
    tags: ["AI", "PKU", "Products"],
    tools: ["Cursor", "Claude Code"],
    buildStory: "Built with AI coding tools and reviewed by the team.",
  });
});

test("parseProductForm rejects unsupported URL protocols", () => {
  const formData = validFormData();
  formData.set("websiteUrl", "javascript:alert(1)");

  assert.equal(parseProductForm(formData), "作品网址 必须是 http 或 https 链接。");
});

test("parseProductForm accepts configured local upload URLs", () => {
  const previousBaseUrl = process.env.UPLOAD_PUBLIC_BASE_URL;
  process.env.UPLOAD_PUBLIC_BASE_URL = "/assets";

  try {
    const formData = validFormData();
    formData.set("logoUrl", "/assets/logo.png");
    formData.set("imageUrls", "/assets/screen.png");

    const parsed = parseProductForm(formData);

    assert.notEqual(typeof parsed, "string");
    if (typeof parsed === "string") return;
    assert.equal(parsed.logoUrl, "/assets/logo.png");
    assert.deepEqual(parsed.imageUrls, ["/assets/screen.png"]);
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.UPLOAD_PUBLIC_BASE_URL;
    } else {
      process.env.UPLOAD_PUBLIC_BASE_URL = previousBaseUrl;
    }
  }
});

test("parseProductForm requires at least one image but accepts missing build details", () => {
  const withoutImage = validFormData();
  withoutImage.set("imageUrls", "");
  assert.equal(parseProductForm(withoutImage), "请至少添加一张截图或作品图片链接。");

  const withoutBuildDetails = validFormData();
  withoutBuildDetails.delete("tools");
  withoutBuildDetails.set("buildStory", "");

  const parsed = parseProductForm(withoutBuildDetails);

  assert.notEqual(typeof parsed, "string");
  if (typeof parsed === "string") return;
  assert.deepEqual(parsed.tools, []);
  assert.equal(parsed.buildStory, "");
});

test("parseProductForm accepts expanded AI coding tools", () => {
  const formData = validFormData();
  formData.delete("tools");
  formData.append("tools", "Codex");
  formData.append("tools", "Kimi Code");
  formData.append("tools", "MiniMax");
  formData.append("tools", "Mimo");
  formData.append("tools", "DeepSeek");
  formData.append("tools", "DeepSeek Coder");

  const parsed = parseProductForm(formData);

  assert.notEqual(typeof parsed, "string");
  if (typeof parsed === "string") return;
  assert.deepEqual(parsed.tools, ["Codex", "Kimi Code", "MiniMax", "Mimo", "DeepSeek", "DeepSeek Coder"]);
});

test("parseProductForm rejects unsupported AI tools", () => {
  const formData = validFormData();
  formData.append("tools", "Unknown Tool");

  assert.equal(parseProductForm(formData), "请选择有效的 AI coding 工具。");
});

test("parseProductForm rejects overlong build stories", () => {
  const formData = validFormData();
  formData.set("buildStory", "a".repeat(1001));

  assert.equal(parseProductForm(formData), "构建故事不要超过 1000 个字符。");
});

test("parseProductForm caps submitted lists and deduplicates tools", () => {
  const formData = validFormData();
  formData.set(
    "imageUrls",
    Array.from({ length: 8 }, (_, index) => `https://example.com/${index}.png`).join("\n"),
  );
  formData.set(
    "tags",
    Array.from({ length: 20 }, (_, index) => `tag-${index}`).join(","),
  );
  formData.delete("tools");
  [
    "Cursor",
    "Claude Code",
    "Lovable",
    "Bolt",
    "Windsurf",
    "Replit",
    "v0",
    "ChatGPT",
    "Cursor",
    "Bolt",
  ].forEach((tool) => formData.append("tools", tool));

  const parsed = parseProductForm(formData);

  assert.notEqual(typeof parsed, "string");
  if (typeof parsed === "string") return;
  assert.equal(parsed.imageUrls.length, 5);
  assert.equal(parsed.tags.length, 12);
  assert.equal(parsed.tools.length, 8);
  assert.deepEqual(parsed.tools, [
    "Cursor",
    "Claude Code",
    "Lovable",
    "Bolt",
    "Windsurf",
    "Replit",
    "v0",
    "ChatGPT",
  ]);
});

test("product review helpers keep published products visible during edits", () => {
  assert.deepEqual(publishedProductWhere, { publishedId: { not: null } });
  assert.deepEqual(pendingReviewProductWhere, {
    pendingDraftId: { not: null },
    status: { not: "REJECTED" },
  });
  assert.equal(statusAfterDraftSubmission({ publishedId: null }), "PENDING_REVIEW");
  assert.equal(statusAfterDraftSubmission({ publishedId: "draft_1" }), "APPROVED");
});

test("slug helpers support duplicate submission retries", () => {
  assert.equal(slugCandidate("vibepku", 0), "vibepku");
  assert.equal(slugCandidate("vibepku", 1), "vibepku-2");
  assert.equal(slugCandidate("vibepku", 9), "vibepku-10");

  assert.equal(
    isUniqueConstraintOn({ code: "P2002", meta: { target: ["slug"] } }, "slug"),
    true,
  );
  assert.equal(
    isUniqueConstraintOn({ code: "P2002", meta: { target: "slug" } }, "slug"),
    true,
  );
  assert.equal(
    isUniqueConstraintOn({ code: "P2002", meta: { target: "Product_slug_key" } }, "slug"),
    true,
  );
  assert.equal(
    isUniqueConstraintOn({ code: "P2002", meta: { target: ["username"] } }, "slug"),
    false,
  );
  assert.equal(isUniqueConstraintOn({ code: "P2003", meta: { target: ["slug"] } }, "slug"), false);
});
