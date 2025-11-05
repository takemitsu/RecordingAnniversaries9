import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@/__tests__/helpers/render";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/app/(main)/profile/ProfileForm";
import type { User } from "next-auth";

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
vi.mock("@/app/actions/profile", () => ({
  updateProfile: vi.fn(),
}));

describe("ProfileForm", () => {
  const mockUser: User = {
    id: "test-user",
    name: "テストユーザー",
    email: "test@example.com",
  };

  describe("Rendering", () => {
    it("フォームが正しくレンダリングされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<ProfileForm user={mockUser} />);

      expect(screen.getByText("プロフィール情報")).toBeInTheDocument();
      expect(
        screen.getByText("アカウントのプロフィール情報を更新します"),
      ).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: /名前/ })).toBeInTheDocument();
      expect(screen.getByText("メールアドレス:")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    });

    it("user.nameが初期値として設定される", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<ProfileForm user={mockUser} />);

      expect(screen.getByRole("textbox", { name: /名前/ })).toHaveValue("テストユーザー");
    });

    it("user.emailが表示される（読み取り専用）", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      render(<ProfileForm user={mockUser} />);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      // emailフィールドは存在しないことを確認
      expect(screen.queryByLabelText("メールアドレス")).not.toBeInTheDocument();
    });
  });

  describe("Validation Errors", () => {
    it("エラーメッセージが表示される", () => {
      const stateWithError = {
        error: "名前は必須です",
      };
      mockUseActionState.mockReturnValue([stateWithError, vi.fn(), false]);

      render(<ProfileForm user={mockUser} />);

      expect(screen.getByText("名前は必須です")).toBeInTheDocument();
    });
  });

  describe("Success Message", () => {
    it("成功メッセージが表示される", () => {
      const stateWithSuccess = {
        success: true,
      };
      mockUseActionState.mockReturnValue([stateWithSuccess, vi.fn(), false]);

      render(<ProfileForm user={mockUser} />);

      expect(screen.getByText("保存しました")).toBeInTheDocument();
    });
  });

  describe("Pending State", () => {
    it("pending時、ボタンがdisableされる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);

      render(<ProfileForm user={mockUser} />);

      const submitButton = screen.getByRole("button", { name: /保存中.../ });
      expect(submitButton).toBeDisabled();
    });

    it("pending時、ローディングテキストが表示される", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), true]);

      render(<ProfileForm user={mockUser} />);

      expect(screen.getByText("保存中...")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("フォーム送信時、formActionが呼ばれる", async () => {
      const user = userEvent.setup();
      const mockFormAction = vi.fn();
      mockUseActionState.mockReturnValue([null, mockFormAction, false]);

      render(<ProfileForm user={mockUser} />);

      await user.clear(screen.getByRole("textbox", { name: /名前/ }));
      await user.type(screen.getByRole("textbox", { name: /名前/ }), "新しい名前");
      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });
    });
  });

  describe("Empty Name", () => {
    it("user.nameがnullの時、空文字が初期値になる", () => {
      mockUseActionState.mockReturnValue([null, vi.fn(), false]);

      const userWithoutName = {
        ...mockUser,
        name: null,
      };

      render(<ProfileForm user={userWithoutName} />);

      expect(screen.getByRole("textbox", { name: /名前/ })).toHaveValue("");
    });
  });
});
