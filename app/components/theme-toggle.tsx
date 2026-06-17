"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) || "system";
    // The persisted theme can only be read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(saved);
    applyTheme(saved);
    setMounted(true);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (localStorage.getItem("theme") === "system" || !localStorage.getItem("theme")) {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  function applyTheme(t: Theme) {
    const resolved = getResolvedTheme(t);
    document.documentElement.setAttribute("data-theme", resolved);
  }

  function toggle() {
    const order: Theme[] = ["system", "light", "dark"];
    const currentIndex = order.indexOf(theme);
    const next = order[(currentIndex + 1) % order.length];
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  if (!mounted) {
    return (
      <button className="theme-toggle" type="button" title="主题">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </button>
    );
  }

  const icons = {
    system: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 14H11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 12V14" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
    light: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 2V3.5M8 12.5V14M2 8H3.5M12.5 8H14M3.8 3.8L4.9 4.9M11.1 11.1L12.2 12.2M12.2 3.8L11.1 4.9M4.9 11.1L3.8 12.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    dark: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M14 8.5C14 12 11.5 15 8 15C5 15 2.5 12.8 1.8 10C2.6 10.3 3.5 10.5 4.4 10.5C7.8 10.5 10.5 7.8 10.5 4.4C10.5 3.2 10.1 2.1 9.5 1.2C12 1.8 14 4.5 14 8.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  };

  const labels = {
    system: "跟随系统",
    light: "浅色模式",
    dark: "深色模式",
  };

  return (
    <button
      className="theme-toggle"
      type="button"
      title={labels[theme]}
      onClick={toggle}
    >
      {icons[theme]}
    </button>
  );
}
