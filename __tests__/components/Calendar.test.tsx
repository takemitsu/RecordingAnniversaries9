import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { Calendar } from "@/components/Calendar";
import type { Holiday } from "@/lib/types/calendar";

describe("Calendar", () => {
  const mockHolidays: Holiday[] = [
    { date: "2025-01-01", name: "元日" },
    { date: "2025-01-13", name: "成人の日" },
  ];

  describe("PC版（年次カレンダー）", () => {
    test("2×6グリッドで12ヶ月が表示される", () => {
      const { container } = render(<Calendar holidays={mockHolidays} />);

      // PC版コンテナを取得
      const pcContainer = container.querySelector(".hidden.lg\\:block");
      expect(pcContainer).toBeInTheDocument();

      // 12ヶ月すべてのヘッダーが表示される（h3要素として）
      const monthHeadings = pcContainer?.querySelectorAll("h3");
      expect(monthHeadings).toHaveLength(12);
    });

    test("年のヘッダーが表示される", () => {
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(`${currentYear}年のカレンダー`),
      ).toBeInTheDocument();
    });

    test("前年ボタンをクリックすると年が変わる", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const prevButton = screen.getByRole("button", {
        name: new RegExp(`${currentYear - 1}`),
      });
      await user.click(prevButton);

      expect(
        screen.getByText(`${currentYear - 1}年のカレンダー`),
      ).toBeInTheDocument();
    });

    test("次年ボタンをクリックすると年が変わる", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const nextButton = screen.getByRole("button", {
        name: new RegExp(`${currentYear + 1}`),
      });
      await user.click(nextButton);

      expect(
        screen.getByText(`${currentYear + 1}年のカレンダー`),
      ).toBeInTheDocument();
    });

    test("今年ボタンをクリックすると現在の年に戻る", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();

      // 次年に移動
      const nextButton = screen.getByRole("button", {
        name: new RegExp(`${currentYear + 1}`),
      });
      await user.click(nextButton);
      expect(
        screen.getByText(`${currentYear + 1}年のカレンダー`),
      ).toBeInTheDocument();

      // 今年ボタンで戻る
      const todayButton = screen.getByRole("button", { name: "今年" });
      await user.click(todayButton);
      expect(
        screen.getByText(`${currentYear}年のカレンダー`),
      ).toBeInTheDocument();
    });

    test("祝日が各月に表示される", () => {
      const { container } = render(<Calendar holidays={mockHolidays} />);

      // PC版コンテナを取得
      const pcContainer = container.querySelector(".hidden.lg\\:block");
      expect(pcContainer).toBeInTheDocument();

      // 祝日アイコン🎌が表示される
      const holidayIcons = pcContainer?.querySelectorAll("span");
      const hasHolidayIcon = Array.from(holidayIcons || []).some(
        (icon) => icon.textContent === "🎌",
      );
      expect(hasHolidayIcon).toBe(true);
    });
  });

  describe("モバイル版（月次カレンダー）", () => {
    test("今月と来月が表示される", () => {
      const { container } = render(<Calendar holidays={mockHolidays} />);

      // モバイル版コンテナを取得
      const mobileContainer = container.querySelector(".lg\\:hidden");
      expect(mobileContainer).toBeInTheDocument();

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      // 今月のヘッダーがh1として表示される
      expect(
        screen.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeInTheDocument();
      // 来月のヘッダーがh2として表示される
      expect(
        screen.getByText(`${nextMonthYear}年${nextMonth}月`),
      ).toBeInTheDocument();
    });

    test("前月ボタンをクリックすると月が変わる", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const prevButton = screen.getByRole("button", { name: "◀" });
      await user.click(prevButton);

      expect(
        screen.getByText(`${prevMonthYear}年${prevMonth}月`),
      ).toBeInTheDocument();
    });

    test("次月ボタンをクリックすると月が変わる", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      const nextButton = screen.getByRole("button", { name: "▶" });
      await user.click(nextButton);

      expect(
        screen.getByText(`${nextMonthYear}年${nextMonth}月`),
      ).toBeInTheDocument();
    });

    test("今月ボタンをクリックすると現在の月に戻る", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

      // 次月に移動
      const nextButton = screen.getByRole("button", { name: "▶" });
      await user.click(nextButton);
      expect(
        screen.getByText(`${nextMonthYear}年${nextMonth}月`),
      ).toBeInTheDocument();

      // 今月ボタンで戻る
      const todayButton = screen.getByRole("button", { name: "今月" });
      await user.click(todayButton);
      expect(
        screen.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeInTheDocument();
    });

    test("12月から翌年1月に正しく遷移する", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 12月まで移動
      const nextButton = screen.getByRole("button", { name: "▶" });
      const clicksToDecember = 12 - currentMonth;
      for (let i = 0; i < clicksToDecember; i++) {
        await user.click(nextButton);
      }
      expect(screen.getByText(`${currentYear}年12月`)).toBeInTheDocument();

      // 次月をクリック → 翌年1月
      await user.click(nextButton);
      expect(screen.getByText(`${currentYear + 1}年1月`)).toBeInTheDocument();
    });

    test("1月から前年12月に正しく遷移する", async () => {
      const user = userEvent.setup();
      render(<Calendar holidays={mockHolidays} />);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 1月まで移動（必要に応じて）
      const prevButton = screen.getByRole("button", { name: "◀" });
      const clicksToJanuary = currentMonth - 1;
      for (let i = 0; i < clicksToJanuary; i++) {
        await user.click(prevButton);
      }

      // 1月の状態で前月をクリック → 前年12月
      await user.click(prevButton);
      expect(screen.getByText(`${currentYear - 1}年12月`)).toBeInTheDocument();
    });
  });
});
