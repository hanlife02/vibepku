"use client";

import { useEffect } from "react";
import { PRODUCT_DRAFT_STORAGE_KEY } from "@/app/hooks/use-form-draft";

export function ClearProductDraft() {
  useEffect(() => {
    try {
      localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return null;
}
