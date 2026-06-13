export const CATEGORIES = [
  "Dev Tools",
  "Creative",
  "Productivity",
  "Education",
  "Social",
  "Open Source",
  "Other",
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  "Dev Tools": "开发工具",
  Creative: "创意设计",
  Productivity: "效率工具",
  Education: "学习教育",
  Social: "社交娱乐",
  "Open Source": "开源项目",
  Other: "其他",
};

export const AI_TOOLS = [
  "Cursor",
  "Claude Code",
  "Lovable",
  "Bolt",
  "Windsurf",
  "Replit",
  "v0",
  "ChatGPT",
] as const;

export type ProductFormState = {
  ok?: boolean;
  error?: string;
  productId?: string;
};

export type ProductFormValues = {
  name: string;
  tagline: string;
  websiteUrl: string;
  logoUrl: string;
  imageUrls: string[];
  demoVideoUrl: string | null;
  category: string;
  tags: string[];
  tools: string[];
  buildStory: string;
};

export function splitList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toStoredList(values: string[]) {
  return JSON.stringify(values.map((item) => item.trim()).filter(Boolean));
}

export function fromStoredList(value: string | null | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    return splitList(value);
  }

  return [];
}

export function createSlug(name: string) {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalized || "product";
}

export function displayCategory(category: string) {
  return CATEGORY_LABELS[category as (typeof CATEGORIES)[number]] ?? category;
}

export function displayStatus(status: string) {
  switch (status) {
    case "APPROVED":
      return "已上线";
    case "PENDING_REVIEW":
      return "待审核";
    case "REJECTED":
      return "已驳回";
    default:
      return status;
  }
}
