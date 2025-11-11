"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // クライアント側でマウント後のみレンダリング（Hydration mismatch回避）
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1 p-1 bg-gray-200 dark:bg-zinc-700 rounded-lg">
        <div className="w-16 h-8" />
      </div>
    );
  }

  return (
    <div className="flex gap-1 p-1 bg-gray-200 dark:bg-zinc-700 rounded-lg">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          theme === "light"
            ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
        aria-label="ライトモード"
      >
        ☀️
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          theme === "dark"
            ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
        aria-label="ダークモード"
      >
        🌙
      </button>
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
          theme === "system"
            ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
        aria-label="システム設定"
      >
        💻
      </button>
    </div>
  );
}
