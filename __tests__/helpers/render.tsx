import type { RenderOptions } from "@testing-library/react";
import { render as rtlRender } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * カスタムRenderヘルパー
 * 必要に応じてProviderを追加可能
 */
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return rtlRender(ui, options);
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
