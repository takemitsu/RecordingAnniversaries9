import userEvent from "@testing-library/user-event";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/webauthn";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/__tests__/helpers/render";
import { PasskeyManager } from "@/app/(main)/profile/PasskeyManager";
import { useConfirmDelete } from "@/hooks/useConfirmDelete";
import type { Authenticator } from "@/lib/db/schema";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// next-auth/webauthn のモック
vi.mock("next-auth/webauthn", () => ({
  signIn: vi.fn(),
}));

// Server Actions のモック
vi.mock("@/app/actions/authenticators", () => ({
  deleteAuthenticator: vi.fn(),
}));

// useConfirmDelete のモック
vi.mock("@/hooks/useConfirmDelete", () => ({
  useConfirmDelete: vi.fn(),
}));

describe("PasskeyManager", () => {
  const mockRefresh = vi.fn();
  const mockConfirmDelete = vi.fn();

  const mockAuthenticator: Authenticator = {
    credentialID: "cred-123",
    userId: "user-123",
    providerAccountId: "provider-123",
    credentialPublicKey: "public-key",
    counter: 0,
    credentialDeviceType: "singleDevice",
    credentialBackedUp: false,
    transports: "internal",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    lastUsedAt: new Date("2024-01-02T00:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      refresh: mockRefresh,
    } as unknown as AppRouterInstance);
    vi.mocked(useConfirmDelete).mockReturnValue({
      confirmDelete: mockConfirmDelete,
      isPending: false,
    });
  });

  describe("Rendering", () => {
    it("Passkey設定セクションが表示される", () => {
      render(<PasskeyManager authenticators={[]} />);

      expect(screen.getByText("Passkey設定")).toBeInTheDocument();
    });

    it("Passkey作成ボタンが表示される", () => {
      render(<PasskeyManager authenticators={[]} />);

      expect(
        screen.getByRole("button", { name: /新しいpasskeyを作成/i }),
      ).toBeInTheDocument();
    });

    it("説明文が表示される", () => {
      render(<PasskeyManager authenticators={[]} />);

      expect(
        screen.getByText(
          /このデバイスの生体認証.*でログインできるようになります/,
        ),
      ).toBeInTheDocument();
    });

    it("登録済みPasskeyセクションが表示される", () => {
      render(<PasskeyManager authenticators={[]} />);

      expect(screen.getByText("登録済みPasskey")).toBeInTheDocument();
    });

    it("Passkey未登録時、適切なメッセージが表示される", () => {
      render(<PasskeyManager authenticators={[]} />);

      expect(
        screen.getByText("Passkeyが登録されていません"),
      ).toBeInTheDocument();
    });

    it("登録済みPasskeyが表示される（単一）", () => {
      render(<PasskeyManager authenticators={[mockAuthenticator]} />);

      // タイムゾーン（Asia/Tokyo = UTC+9）を考慮した表示
      expect(screen.getByText("2024-01-01 09:00 登録")).toBeInTheDocument();
      expect(screen.getByText("2024-01-02 09:00 最終使用")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
    });

    it("登録済みPasskeyが表示される（複数）", () => {
      const mockAuthenticator2: Authenticator = {
        ...mockAuthenticator,
        credentialID: "cred-456",
        createdAt: new Date("2024-02-01T00:00:00Z"),
        lastUsedAt: new Date("2024-02-02T00:00:00Z"),
      };

      render(
        <PasskeyManager
          authenticators={[mockAuthenticator, mockAuthenticator2]}
        />,
      );

      // タイムゾーン（Asia/Tokyo = UTC+9）を考慮した表示
      expect(screen.getByText("2024-01-01 09:00 登録")).toBeInTheDocument();
      expect(screen.getByText("2024-02-01 09:00 登録")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "削除" })).toHaveLength(2);
    });

    it("lastUsedAtがnullの場合、未使用と表示される", () => {
      const mockAuthenticatorNotUsed: Authenticator = {
        ...mockAuthenticator,
        lastUsedAt: null,
      };

      render(<PasskeyManager authenticators={[mockAuthenticatorNotUsed]} />);

      expect(screen.getByText("未使用 最終使用")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("NotAllowedError時、エラーメッセージが表示されない", async () => {
      const user = userEvent.setup();
      const error = new Error("User cancelled");
      error.name = "NotAllowedError";
      vi.mocked(signIn).mockRejectedValueOnce(error);

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      // エラーメッセージが表示されない
      expect(
        screen.queryByText(/passkeyの作成に失敗しました/i),
      ).not.toBeInTheDocument();
    });

    it("InvalidStateError時、適切なエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const error = new Error("Already registered");
      error.name = "InvalidStateError";
      vi.mocked(signIn).mockRejectedValueOnce(error);

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(
        screen.getByText("このデバイスには既にPasskeyが登録されています"),
      ).toBeInTheDocument();
    });

    it("NotSupportedError時、適切なエラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const error = new Error("Not supported");
      error.name = "NotSupportedError";
      vi.mocked(signIn).mockRejectedValueOnce(error);

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(
        screen.getByText("お使いのブラウザはPasskeyに対応していません"),
      ).toBeInTheDocument();
    });

    it("その他のError時、汎用エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const error = new Error("Unknown error");
      error.name = "UnknownError";
      vi.mocked(signIn).mockRejectedValueOnce(error);

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(
        screen.getByText("Passkeyの作成に失敗しました"),
      ).toBeInTheDocument();
    });

    it("非Errorオブジェクトが投げられた場合、汎用エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn).mockRejectedValueOnce("string error");

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(
        screen.getByText("Passkeyの作成に失敗しました"),
      ).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("Passkey作成中、ボタンがdisableされる", async () => {
      const user = userEvent.setup();
      // signInを遅延させる
      vi.mocked(signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      // クリック後、ローディング状態になる
      expect(
        screen.getByRole("button", { name: /passkey作成中/i }),
      ).toBeDisabled();
    });

    it("Passkey作成中、ローディングテキストが表示される", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(screen.getByText(/passkey作成中/i)).toBeInTheDocument();
    });

    it("削除中、削除ボタンがdisableされる", () => {
      vi.mocked(useConfirmDelete).mockReturnValue({
        confirmDelete: mockConfirmDelete,
        isPending: true,
      });

      render(<PasskeyManager authenticators={[mockAuthenticator]} />);

      const deleteButton = screen.getByRole("button", { name: "削除" });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("User Interaction", () => {
    it("Passkey作成成功時、router.refresh()が呼ばれる", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn).mockResolvedValueOnce(undefined as never);

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it("削除ボタンクリック時、confirmDeleteが呼ばれる", async () => {
      const user = userEvent.setup();

      render(<PasskeyManager authenticators={[mockAuthenticator]} />);

      const deleteButton = screen.getByRole("button", { name: "削除" });
      await user.click(deleteButton);

      expect(mockConfirmDelete).toHaveBeenCalledWith(
        "このPasskey",
        expect.any(Function),
      );
    });

    it("Passkey作成時、signInが正しい引数で呼ばれる", async () => {
      const user = userEvent.setup();
      vi.mocked(signIn).mockResolvedValueOnce(undefined as never);

      render(<PasskeyManager authenticators={[]} />);

      const createButton = screen.getByRole("button", {
        name: /新しいpasskeyを作成/i,
      });
      await user.click(createButton);

      expect(signIn).toHaveBeenCalledWith("passkey", {
        action: "register",
        redirect: false,
      });
    });
  });
});
