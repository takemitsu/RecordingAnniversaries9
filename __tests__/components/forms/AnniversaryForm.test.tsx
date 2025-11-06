import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/__tests__/helpers/render";
import { AnniversaryForm } from "@/components/forms/AnniversaryForm";
import type { Anniversary } from "@/lib/db/schema";

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
vi.mock("@/app/actions/anniversaries", () => ({
  createAnniversary: vi.fn(),
  updateAnniversary: vi.fn(),
}));

// useRouter のモックは __tests__/setup.ts でグローバルに定義済み
import { useRouter } from "next/navigation";

describe("AnniversaryForm", () => {
  const mockAnniversary: Anniversary = {
    id: 1,
    collectionId: 1,
    name: "誕生日",
    anniversaryDate: "2020-11-04",
    description: "大切な日",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Mode: Create", () => {
    it("作成モードでフォームがレンダリングされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

      expect(
        screen.getByRole("textbox", { name: /記念日名/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /説明/ })).toBeInTheDocument();
      expect(
        screen.getByLabelText(/^記念日/, { selector: 'input[type="date"]' }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "作成" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "キャンセル" }),
      ).toBeInTheDocument();
    });
  });

  describe("Mode: Edit", () => {
    it("編集モードでフォームがレンダリングされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(
        <AnniversaryForm
          mode="edit"
          collectionId={1}
          anniversary={mockAnniversary}
        />,
      );

      expect(screen.getByRole("textbox", { name: /記念日名/ })).toHaveValue(
        "誕生日",
      );
      expect(screen.getByRole("textbox", { name: /説明/ })).toHaveValue(
        "大切な日",
      );
      expect(
        screen.getByLabelText(/^記念日/, { selector: 'input[type="date"]' }),
      ).toHaveValue("2020-11-04");
      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    });

    it("初期値が正しく設定される", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(
        <AnniversaryForm
          mode="edit"
          collectionId={1}
          anniversary={mockAnniversary}
        />,
      );

      expect(screen.getByRole("textbox", { name: /記念日名/ })).toHaveValue(
        "誕生日",
      );
      expect(screen.getByRole("textbox", { name: /説明/ })).toHaveValue(
        "大切な日",
      );
      expect(
        screen.getByLabelText(/^記念日/, { selector: 'input[type="date"]' }),
      ).toHaveValue("2020-11-04");
    });
  });

  describe("Validation Errors", () => {
    it("バリデーションエラーが表示される（name）", () => {
      const stateWithError = {
        errors: { name: ["記念日名は必須です"] },
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

      expect(screen.getByText("記念日名は必須です")).toBeInTheDocument();
    });

    it("バリデーションエラーが表示される（anniversaryDate）", () => {
      const stateWithError = {
        errors: { anniversaryDate: ["記念日は必須です"] },
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

      expect(screen.getByText("記念日は必須です")).toBeInTheDocument();
    });

    it("全体エラーが表示される", () => {
      const stateWithError = {
        error: "作成に失敗しました",
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

      expect(screen.getByText("作成に失敗しました")).toBeInTheDocument();
    });

    it("バリデーションエラー時、入力値が保持される", () => {
      const stateWithError = {
        errors: { name: ["記念日名は必須です"] },
        fieldValues: {
          name: "テスト",
          description: "説明",
          anniversaryDate: "2025-12-31",
        },
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

      expect(screen.getByRole("textbox", { name: /記念日名/ })).toHaveValue(
        "テスト",
      );
      expect(screen.getByRole("textbox", { name: /説明/ })).toHaveValue("説明");
      expect(
        screen.getByLabelText(/^記念日/, { selector: 'input[type="date"]' }),
      ).toHaveValue("2025-12-31");
    });
  });

  describe("Pending State", () => {
    it("pending時、ボタンがdisableされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

      const submitButton = screen.getByRole("button", { name: /保存中.../ });
      expect(submitButton).toBeDisabled();
    });

    it("pending時、ローディングテキストが表示される", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);

      render(<AnniversaryForm mode="create" collectionId={1} />);

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

      render(<AnniversaryForm mode="create" collectionId={1} />);

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

      render(<AnniversaryForm mode="create" collectionId={1} />);

      await user.type(
        screen.getByRole("textbox", { name: /記念日名/ }),
        "新しい記念日",
      );
      await user.type(
        screen.getByLabelText(/^記念日/, { selector: 'input[type="date"]' }),
        "2025-12-31",
      );
      await user.click(screen.getByRole("button", { name: "作成" }));

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });
    });
  });
});
