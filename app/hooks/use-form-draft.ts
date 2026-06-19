"use client";

import { useRef, useEffect, useCallback } from "react";

export const PRODUCT_DRAFT_STORAGE_KEY = "vibepku-product-draft";

type DraftData = {
  name: string;
  websiteUrl: string;
  tagline: string;
  category: string;
  tags: string;
  logoUrl: string;
  demoVideoUrl: string;
  imageUrls: string;
  tools: string[];
  buildStory: string;
  logoPreview: string;
  imagePreviews: string[];
};

function readDraftData(
  form: HTMLFormElement,
  logoUrlInput: HTMLInputElement | null,
  imageUrlInput: HTMLTextAreaElement | null,
  logoPreview: string,
  imagePreviews: string[],
  selectedTools: string[],
): DraftData {
  const val = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value ?? "";

  return {
    name: val("name"),
    websiteUrl: val("websiteUrl"),
    tagline: val("tagline"),
    category: val("category"),
    tags: val("tags"),
    logoUrl: logoUrlInput?.value ?? "",
    demoVideoUrl: val("demoVideoUrl"),
    imageUrls: imageUrlInput?.value ?? "",
    tools: selectedTools,
    buildStory: val("buildStory"),
    logoPreview,
    imagePreviews,
  };
}

function restoreDraftData(
  draft: DraftData,
  form: HTMLFormElement,
  logoUrlInput: HTMLInputElement | null,
  imageUrlInput: HTMLTextAreaElement | null,
  setLogoPreview: (v: string) => void,
  setImagePreviews: (v: string[]) => void,
  setSelectedTools: (v: string[]) => void,
) {
  const setVal = (name: string, value: string) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (el) el.value = value;
  };

  setVal("name", draft.name);
  setVal("websiteUrl", draft.websiteUrl);
  setVal("tagline", draft.tagline);
  setVal("category", draft.category);
  setVal("tags", draft.tags);
  setVal("demoVideoUrl", draft.demoVideoUrl);
  setVal("buildStory", draft.buildStory);

  if (logoUrlInput) logoUrlInput.value = draft.logoUrl;
  if (imageUrlInput) imageUrlInput.value = draft.imageUrls;

  const toolsCheckboxes = form.querySelectorAll<HTMLInputElement>('input[data-tool-option="true"]');
  toolsCheckboxes.forEach((cb) => {
    cb.checked = draft.tools.includes(cb.value);
  });

  setLogoPreview(draft.logoPreview);
  setImagePreviews(draft.imagePreviews);
  setSelectedTools(draft.tools);
}

type UseFormDraftOptions = {
  enabled: boolean;
  formRef: React.RefObject<HTMLFormElement | null>;
  logoUrlInputRef: React.RefObject<HTMLInputElement | null>;
  imageUrlInputRef: React.RefObject<HTMLTextAreaElement | null>;
  logoPreview: string;
  imagePreviews: string[];
  selectedTools: string[];
  setLogoPreview: (v: string) => void;
  setImagePreviews: (v: string[]) => void;
  setSelectedTools: (v: string[]) => void;
};

export function useFormDraft({
  enabled,
  formRef,
  logoUrlInputRef,
  imageUrlInputRef,
  logoPreview,
  imagePreviews,
  selectedTools,
  setLogoPreview,
  setImagePreviews,
  setSelectedTools,
}: UseFormDraftOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlledRef = useRef({ logoPreview, imagePreviews, selectedTools });

  useEffect(() => {
    controlledRef.current = { logoPreview, imagePreviews, selectedTools };
  }, [logoPreview, imagePreviews, selectedTools]);

  const saveDraft = useCallback(() => {
    if (!enabled) return;

    const form = formRef.current;
    if (!form) return;

    const data = readDraftData(
      form,
      logoUrlInputRef.current,
      imageUrlInputRef.current,
      controlledRef.current.logoPreview,
      controlledRef.current.imagePreviews,
      controlledRef.current.selectedTools,
    );

    try {
      localStorage.setItem(PRODUCT_DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable or quota exceeded
    }
  }, [enabled, formRef, logoUrlInputRef, imageUrlInputRef]);

  const debouncedSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveDraft, 1000);
  }, [saveDraft]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Restore draft on mount
  useEffect(() => {
    if (!enabled) return;

    const form = formRef.current;
    if (!form) return;

    try {
      const raw = localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as DraftData;
      restoreDraftData(
        draft,
        form,
        logoUrlInputRef.current,
        imageUrlInputRef.current,
        setLogoPreview,
        setImagePreviews,
        setSelectedTools,
      );
    } catch {
      // ignore corrupt data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for form changes
  useEffect(() => {
    if (!enabled) return;

    const form = formRef.current;
    if (!form) return;

    const handler = () => debouncedSave();
    form.addEventListener("input", handler);
    form.addEventListener("change", handler);
    return () => {
      form.removeEventListener("input", handler);
      form.removeEventListener("change", handler);
    };
  }, [enabled, formRef, debouncedSave]);

  useEffect(() => {
    if (!enabled) return;
    debouncedSave();
  }, [enabled, logoPreview, imagePreviews, selectedTools, debouncedSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveDraft, clearDraft };
}
