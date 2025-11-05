import { describe, expect, it } from "vitest";
import { render, screen } from "@/__tests__/helpers/render";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  describe("Rendering", () => {
    it("childrenを正しく表示", () => {
      render(<Button>クリック</Button>);

      expect(screen.getByRole("button", { name: "クリック" })).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("loading=trueでスピナーが表示される", () => {
      render(<Button loading>読み込み中</Button>);

      expect(screen.getByRole("img", { name: "読み込み中" })).toBeInTheDocument();
    });

    it("loading=trueでボタンがdisableになる", () => {
      render(<Button loading>送信</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Disabled State", () => {
    it("disabled=trueでボタンがdisableになる", () => {
      render(<Button disabled>送信</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});
