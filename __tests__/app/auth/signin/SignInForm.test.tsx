import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { signIn as reactSignIn } from "next-auth/react";
import { signIn as passkeySignIn } from "next-auth/webauthn";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/__tests__/helpers/render";
import SignInForm from "@/app/auth/signin/SignInForm";

// SignInResponse型定義（next-auth/lib/clientより）
interface SignInResponse {
  error: string | undefined;
  code: string | undefined;
  status: number;
  ok: boolean;
  url: string | null;
}

// next/navigation のモック
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// next-auth/react のモック
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

// next-auth/webauthn のモック
vi.mock("next-auth/webauthn", () => ({
  signIn: vi.fn(),
}));

describe("SignInForm", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as AppRouterInstance);
  });

  describe("Rendering", () => {
    it("Googleログインボタンが表示される", () => {
      render(<SignInForm />);

      expect(
        screen.getByRole("button", { name: /googleでログイン/i }),
      ).toBeInTheDocument();
    });

    it("Passkeyログインボタンが表示される", () => {
      render(<SignInForm />);

      expect(
        screen.getByRole("button", { name: /passkeyでログイン/i }),
      ).toBeInTheDocument();
    });

    it("Passkey説明テキストが表示される", () => {
      render(<SignInForm />);

      expect(
        screen.getByText("※既にPasskeyを登録済みの方はこちら"),
      ).toBeInTheDocument();
    });

    it("説明文が表示される", () => {
      render(<SignInForm />);

      expect(
        screen.getByText("Googleアカウントでログインまたは新規登録"),
      ).toBeInTheDocument();
    });
  });

  describe("Passkey Error Handling", () => {
    it("NotAllowedError時、エラーメッセージが表示されない", async () => {
      const user = userEvent.setup();
      const error = new Error("User cancelled");
      error.name = "NotAllowedError";
      vi.mocked(passkeySignIn).mockRejectedValueOnce(error);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      // エラーメッセージが表示されない
      expect(
        screen.queryByText(/passkeyでのログインに失敗しました/i),
      ).not.toBeInTheDocument();
    });

    it("InvalidStateError時、適切なエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const error = new Error("No credentials");
      error.name = "InvalidStateError";
      vi.mocked(passkeySignIn).mockRejectedValueOnce(error);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(
        screen.getByText(
          "Passkeyが登録されていません。Googleログインをお試しください。",
        ),
      ).toBeInTheDocument();
    });

    it("その他のError時、汎用エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const error = new Error("Unknown error");
      error.name = "UnknownError";
      vi.mocked(passkeySignIn).mockRejectedValueOnce(error);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(
        screen.getByText(
          "Passkeyでのログインに失敗しました。Googleログインをお試しください。",
        ),
      ).toBeInTheDocument();
    });

    it("Auth.jsのConfigurationエラー時、適切なエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockResolvedValueOnce({
        error: "Configuration",
        ok: false,
      } as unknown as SignInResponse);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(
        screen.getByText(
          "このPasskeyは登録されていません。Googleログインをお試しください。",
        ),
      ).toBeInTheDocument();
    });

    it("Auth.jsのその他のエラー時、汎用エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockResolvedValueOnce({
        error: "OtherError",
        ok: false,
      } as unknown as SignInResponse);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(
        screen.getByText(
          "Passkeyでのログインに失敗しました。Googleログインをお試しください。",
        ),
      ).toBeInTheDocument();
    });

    it("非Errorオブジェクトが投げられた場合、汎用エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockRejectedValueOnce("string error");

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(
        screen.getByText(
          "Passkeyでのログインに失敗しました。Googleログインをお試しください。",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Google Error Handling", () => {
    it("Googleログインエラー時、エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(reactSignIn).mockRejectedValueOnce(new Error("Google error"));

      render(<SignInForm />);

      const googleButton = screen.getByRole("button", {
        name: /googleでログイン/i,
      });
      await user.click(googleButton);

      expect(
        screen.getByText("ログインに失敗しました。もう一度お試しください。"),
      ).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("Passkey認証中、ボタンがdisableされる", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(screen.getByRole("button", { name: /認証中/i })).toBeDisabled();
    });

    it("Passkey認証中、ローディングテキストが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(screen.getByText(/認証中/i)).toBeInTheDocument();
    });

    it("Google認証中、ボタンがdisableされる", async () => {
      const user = userEvent.setup();
      vi.mocked(reactSignIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<SignInForm />);

      const googleButton = screen.getByRole("button", {
        name: /googleでログイン/i,
      });
      await user.click(googleButton);

      expect(
        screen.getByRole("button", { name: /ログイン中/i }),
      ).toBeDisabled();
    });

    it("Google認証中、ローディングテキストが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(reactSignIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<SignInForm />);

      const googleButton = screen.getByRole("button", {
        name: /googleでログイン/i,
      });
      await user.click(googleButton);

      expect(screen.getByText(/ログイン中/i)).toBeInTheDocument();
    });
  });

  describe("User Interaction", () => {
    it("Passkey認証成功時、ホームにリダイレクトされる", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockResolvedValueOnce({
        ok: true,
      } as unknown as SignInResponse);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("Passkeyログイン時、passkeySignInが正しい引数で呼ばれる", async () => {
      const user = userEvent.setup();
      vi.mocked(passkeySignIn).mockResolvedValueOnce({
        ok: true,
      } as unknown as SignInResponse);

      render(<SignInForm />);

      const passkeyButton = screen.getByRole("button", {
        name: /passkeyでログイン/i,
      });
      await user.click(passkeyButton);

      expect(passkeySignIn).toHaveBeenCalledWith("passkey", {
        redirect: false,
      });
    });

    it("Googleログイン時、reactSignInが正しい引数で呼ばれる", async () => {
      const user = userEvent.setup();
      vi.mocked(reactSignIn).mockResolvedValueOnce(undefined as never);

      render(<SignInForm />);

      const googleButton = screen.getByRole("button", {
        name: /googleでログイン/i,
      });
      await user.click(googleButton);

      expect(reactSignIn).toHaveBeenCalledWith("google", { redirectTo: "/" });
    });
  });
});
