/**
 * アプリケーション全体で使用する定数
 */

/**
 * コレクション（グループ）の表示設定
 */
export const VISIBILITY = {
  VISIBLE: 0,
  HIDDEN: 1,
} as const;

export type VisibilityValue = (typeof VISIBILITY)[keyof typeof VISIBILITY];
