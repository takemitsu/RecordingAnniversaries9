import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/__tests__/helpers/render";
import userEvent from "@testing-library/user-event";
import { CollectionCard } from "@/components/CollectionCard";
import type { Anniversary, Collection } from "@/lib/db/schema";
import { VISIBILITY } from "@/lib/constants";

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

describe("CollectionCard", () => {
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

  const mockCollection: Collection & { anniversaries: Anniversary[] } = {
    id: 1,
    userId: "test-user",
    name: "家族",
    description: "家族の記念日",
    isVisible: VISIBILITY.VISIBLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    anniversaries: [mockAnniversary],
  };

  describe("Rendering", () => {
    it("Collection情報が正しく表示される", () => {
      render(
        <CollectionCard collection={mockCollection} showActions={false} />,
      );

      expect(screen.getByText("家族")).toBeInTheDocument();
      expect(screen.getByText("家族の記念日")).toBeInTheDocument();
    });

    it("descriptionがnullの場合は表示されない", () => {
      const collectionWithoutDesc = {
        ...mockCollection,
        description: null,
      };

      render(
        <CollectionCard
          collection={collectionWithoutDesc}
          showActions={false}
        />,
      );

      expect(screen.queryByText("家族の記念日")).not.toBeInTheDocument();
    });
  });

  describe("Anniversaries Display", () => {
    it("anniversariesがある場合、AnniversaryCardが表示される", () => {
      render(
        <CollectionCard collection={mockCollection} showActions={false} />,
      );

      expect(screen.getByText("誕生日")).toBeInTheDocument();
      expect(screen.getByText("大切な日")).toBeInTheDocument();
    });

    it("anniversariesが空の場合「記念日はまだありません」が表示される", () => {
      const emptyCollection = {
        ...mockCollection,
        anniversaries: [],
      };

      render(
        <CollectionCard collection={emptyCollection} showActions={false} />,
      );

      expect(screen.getByText("記念日はまだありません")).toBeInTheDocument();
    });

    it("複数のanniversariesが表示される", () => {
      const multiAnniversariesCollection = {
        ...mockCollection,
        anniversaries: [
          mockAnniversary,
          {
            ...mockAnniversary,
            id: 2,
            name: "結婚記念日",
            anniversaryDate: "2014-11-01",
          },
        ],
      };

      render(
        <CollectionCard
          collection={multiAnniversariesCollection}
          showActions={false}
        />,
      );

      expect(screen.getByText("誕生日")).toBeInTheDocument();
      expect(screen.getByText("結婚記念日")).toBeInTheDocument();
    });
  });

  describe("Visibility Icon", () => {
    it("showActions=true かつ isVisible=HIDDEN の時、アイコンが表示される", () => {
      const hiddenCollection = {
        ...mockCollection,
        isVisible: VISIBILITY.HIDDEN,
      };

      render(<CollectionCard collection={hiddenCollection} showActions={true} />);

      expect(screen.getByTitle("一覧に非表示")).toBeInTheDocument();
    });

    it("showActions=false の時、アイコンが表示されない", () => {
      const hiddenCollection = {
        ...mockCollection,
        isVisible: VISIBILITY.HIDDEN,
      };

      render(
        <CollectionCard collection={hiddenCollection} showActions={false} />,
      );

      expect(screen.queryByTitle("一覧に非表示")).not.toBeInTheDocument();
    });

    it("isVisible=VISIBLE の時、アイコンが表示されない", () => {
      render(<CollectionCard collection={mockCollection} showActions={true} />);

      expect(screen.queryByTitle("一覧に非表示")).not.toBeInTheDocument();
    });
  });

  describe("Show Actions", () => {
    it("showActions=trueの時、削除・編集・記念日追加ボタンが表示される", () => {
      render(<CollectionCard collection={mockCollection} showActions={true} />);

      // Collection自体とAnniversary両方に「削除」ボタンがあるため、複数存在する
      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

      // Collection自体とAnniversary両方に「編集」リンクがあるため、複数存在する
      const editLinks = screen.getAllByRole("link", { name: "編集" });
      expect(editLinks.length).toBeGreaterThanOrEqual(1);

      expect(
        screen.getByRole("link", { name: "記念日追加" }),
      ).toBeInTheDocument();
    });

    it("showActions=falseの時、ボタンが表示されない", () => {
      render(<CollectionCard collection={mockCollection} showActions={false} />);

      expect(screen.queryByRole("button", { name: "削除" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "編集" })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "記念日追加" }),
      ).not.toBeInTheDocument();
    });

    it("削除ボタンクリック時にonDeleteが呼ばれる", async () => {
      // fake timersとuserEventの競合を避けるため、一時的に無効化
      vi.useRealTimers();

      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <CollectionCard
          collection={mockCollection}
          showActions={true}
          onDelete={onDelete}
        />,
      );

      // Collection自体の削除ボタン（最初の削除ボタン）をクリック
      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      await user.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalledWith(1, "家族");

      // fake timersを再設定
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-11-04"));
    });
  });
});
