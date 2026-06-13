"use client";

import { useEffect } from "react";

export function ThemeScript() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "system";

    function apply() {
      let resolved: "light" | "dark";
      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      } else {
        resolved = theme as "light" | "dark";
      }
      document.documentElement.setAttribute("data-theme", resolved);
    }

    apply();

    // 监听系统主题变化
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  return null;
}
