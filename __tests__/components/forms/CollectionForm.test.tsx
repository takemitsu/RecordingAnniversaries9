import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/__tests__/helpers/render";
import { CollectionForm } from "@/components/forms/CollectionForm";
import { VISIBILITY } from "@/lib/constants";
import type { Collection } from "@/lib/db/schema";

// useActionState のモック - vi.hoisted で作成
const mockUseActionState = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useActionState: mockUseActionState,
  };
});

// Server Actions のモック
vi.mock("@/app/actions/collections", () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

// useRouter のモックは __tests__/setup.ts でグローバルに定義済み
import { useRouter } from "next/navigation";

describe("CollectionForm", () => {
  const mockCollection: Collection = {
    id: 1,
    userId: "test-user",
    name: "家族",
    description: "家族の記念日",
    isVisible: VISIBILITY.VISIBLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Mode: Create", () => {
    it("作成モードでフォームがレンダリングされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<CollectionForm mode="create" />);

      expect(
        screen.getByRole("textbox", { name: /グループ名/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /説明/ })).toBeInTheDocument();
      expect(screen.getByLabelText("表示設定")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "作成" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "キャンセル" }),
      ).toBeInTheDocument();
    });
  });

  describe("Mode: Edit", () => {
    it("編集モードでフォームがレンダリングされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<CollectionForm mode="edit" collection={mockCollection} />);

      expect(screen.getByRole("textbox", { name: /グループ名/ })).toHaveValue(
        "家族",
      );
      expect(screen.getByRole("textbox", { name: /説明/ })).toHaveValue(
        "家族の記念日",
      );
      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    });

    it("初期値が正しく設定される", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<CollectionForm mode="edit" collection={mockCollection} />);

      expect(screen.getByRole("textbox", { name: /グループ名/ })).toHaveValue(
        "家族",
      );
      expect(screen.getByRole("textbox", { name: /説明/ })).toHaveValue(
        "家族の記念日",
      );
      expect(screen.getByLabelText("表示設定")).toHaveValue(
        String(VISIBILITY.VISIBLE),
      );
    });
  });

  describe("Validation Errors", () => {
    it("バリデーションエラーが表示される（name）", () => {
      const stateWithError = {
        errors: { name: ["名前は必須です"] },
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<CollectionForm mode="create" />);

      expect(screen.getByText("名前は必須です")).toBeInTheDocument();
    });

    it("全体エラーが表示される", () => {
      const stateWithError = {
        error: "作成に失敗しました",
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<CollectionForm mode="create" />);

      expect(screen.getByText("作成に失敗しました")).toBeInTheDocument();
    });

    it("バリデーションエラー時、入力値が保持される", () => {
      const stateWithError = {
        errors: { name: ["名前は必須です"] },
        fieldValues: { name: "テスト", description: "説明" },
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<CollectionForm mode="create" />);

      expect(screen.getByRole("textbox", { name: /グループ名/ })).toHaveValue(
        "テスト",
      );
      expect(screen.getByRole("textbox", { name: /説明/ })).toHaveValue("説明");
    });
  });

  describe("Pending State", () => {
    it("pending時、ボタンがdisableされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);

      render(<CollectionForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /保存中.../ });
      expect(submitButton).toBeDisabled();
    });

    it("pending時、ローディングテキストが表示される", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);

      render(<CollectionForm mode="create" />);

      expect(screen.getByText("保存中...")).toBeInTheDocument();
    });
  });

  describe("Cancel Button", () => {
    it("キャンセルボタンクリックでrouter.pushが呼ばれる", async () => {
      const user = userEvent.setup();
      const mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
      } as ReturnType<typeof useRouter>;
      vi.mocked(useRouter).mockReturnValue(mockRouter);
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<CollectionForm mode="create" />);

      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/edit");
      });
    });
  });

  describe("Form Submission", () => {
    it("フォーム送信時、formActionが呼ばれる", async () => {
      const user = userEvent.setup();
      const mockFormAction = vi.fn();
      mockUseActionState.mockReturnValue([null, mockFormAction, false]);

      render(<CollectionForm mode="create" />);

      await user.type(
        screen.getByRole("textbox", { name: /グループ名/ }),
        "新しいグループ",
      );
      await user.click(screen.getByRole("button", { name: "作成" }));

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });
    });
  });

  describe("Visibility Select", () => {
    it("表示設定のデフォルト値がVISIBLE", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<CollectionForm mode="create" />);

      expect(screen.getByLabelText("表示設定")).toHaveValue(
        String(VISIBILITY.VISIBLE),
      );
    });
  });
});
