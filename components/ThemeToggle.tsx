"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  variant?: "inline" | "dropdown";
  onThemeChange?: () => void;
}

export function ThemeToggle({
  variant = "inline",
  onThemeChange,
}: ThemeToggleProps = {}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // クライアント側でマウント後のみレンダリング（Hydration mismatch回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    onThemeChange?.();
  };

  if (!mounted) {
    if (variant === "dropdown") {
      return null; // ドロップダウン版はマウント前は何も表示しない
    }
    return (
      <div className="flex gap-1 p-1 bg-gray-200 dark:bg-zinc-700 rounded-lg">
        <div className="w-16 h-8" />
      </div>
    );
  }

  if (variant === "dropdown") {
    const themeOptions = [
      { value: "light" as const, icon: "☀️", label: "ライト" },
      { value: "dark" as const, icon: "🌙", label: "ダーク" },
      { value: "system" as const, icon: "💻", label: "システム" },
    ];

    return (
      <>
        {themeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleThemeChange(option.value)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="flex items-center gap-2">
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </span>
            {theme === option.value && <span>✓</span>}
          </button>
        ))}
      </>
    );
  }

  const themeOptions = [
    { value: "light" as const, icon: "☀️", label: "ライトモード" },
    { value: "dark" as const, icon: "🌙", label: "ダークモード" },
    { value: "system" as const, icon: "💻", label: "システム設定" },
  ];

  return (
    <div className="flex gap-1 p-1 bg-gray-200 dark:bg-zinc-700 rounded-lg">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleThemeChange(option.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            theme === option.value
              ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
          aria-label={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
