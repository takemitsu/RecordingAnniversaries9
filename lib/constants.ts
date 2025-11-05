/**
 * アプリケーション全体で使用する定数
 */

/**
 * コレクション（グループ）の表示設定
 */
export const VISIBILITY = {
  VISIBLE: 1,
  HIDDEN: 0,
} as const;

export type VisibilityValue = (typeof VISIBILITY)[keyof typeof VISIBILITY];
