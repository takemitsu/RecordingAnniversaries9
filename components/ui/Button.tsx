"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "submit" | "danger" | "warning" | "secondary";
  size?: "default" | "sm";
  loading?: boolean;
}

export function Button({
  children,
  variant = "submit",
  size = "default",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition";

  const variantStyles = {
    submit: "bg-sky-600 hover:bg-sky-700 text-white",
    danger: "bg-pink-500 hover:bg-pink-600 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white",
  };

  const sizeStyles = {
    default: "px-6 py-2",
    sm: "px-2 py-1 text-xs",
  };

  const loadingStyles =
    variant === "submit" ? "flex items-center justify-center gap-2" : "";

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${loadingStyles} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="img"
          aria-label="読み込み中"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
