"use client";

interface FormSuccessMessageProps {
  show: boolean;
  message?: string;
}

export function FormSuccessMessage({
  show,
  message = "保存しました",
}: FormSuccessMessageProps) {
  if (!show) return null;

  return (
    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
      {message}
    </span>
  );
}
