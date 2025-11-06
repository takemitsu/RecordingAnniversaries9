import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/__tests__/helpers/render";
import { AnniversaryCard } from "@/components/AnniversaryCard";
import type { Anniversary } from "@/lib/db/schema";

// Next.js Link のモック
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AnniversaryCard", () => {
  // 日付計算テストのため、時間を固定
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-11-04"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockAnniversary: Anniversary = {
    id: 1,
    collectionId: 1,
    name: "誕生日",
    anniversaryDate: "2020-11-04",
    description: "大切な日",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Rendering", () => {
    it("Anniversary情報が正しく表示される", () => {
      render(
        <AnniversaryCard
          anniversary={mockAnniversary}
          collectionId={1}
          showActions={false}
        />,
      );

      expect(screen.getByText("誕生日")).toBeInTheDocument();
      expect(screen.getByText("2020-11-04（令和2年）")).toBeInTheDocument();
      expect(screen.getByText("大切な日")).toBeInTheDocument();
    });

    it("descriptionがnullの場合は表示されない", () => {
      const anniversaryWithoutDesc = {
        ...mockAnniversary,
        description: null,
      };

      render(
        <AnniversaryCard
          anniversary={anniversaryWithoutDesc}
          collectionId={1}
          showActions={false}
        />,
      );

      expect(screen.queryByText("大切な日")).not.toBeInTheDocument();
    });
  });

  describe("Show Actions", () => {
    it("showActions=trueの時、削除・編集ボタンが表示される", () => {
      render(
        <AnniversaryCard
          anniversary={mockAnniversary}
          collectionId={1}
          showActions={true}
        />,
      );

      expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "編集" })).toBeInTheDocument();
    });

    it("showActions=falseの時、削除・編集ボタンが表示されない", () => {
      render(
        <AnniversaryCard
          anniversary={mockAnniversary}
          collectionId={1}
          showActions={false}
        />,
      );

      expect(
        screen.queryByRole("button", { name: "削除" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "編集" }),
      ).not.toBeInTheDocument();
    });

    it("削除ボタンクリック時にonDeleteが呼ばれる", async () => {
      // fake timersとuserEventの競合を避けるため、一時的に無効化
      vi.useRealTimers();

      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <AnniversaryCard
          anniversary={mockAnniversary}
          collectionId={1}
          showActions={true}
          onDelete={onDelete}
        />,
      );

      await user.click(screen.getByRole("button", { name: "削除" }));

      expect(onDelete).toHaveBeenCalledWith(1, "誕生日");

      // fake timersを再設定
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-04"));
    });
  });
});
