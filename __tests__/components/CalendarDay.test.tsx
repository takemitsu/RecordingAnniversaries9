import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { CalendarDay } from "@/components/CalendarDay";
import type { CalendarDay as CalendarDayType } from "@/lib/types/calendar";

describe("CalendarDay", () => {
  const createMockDay = (
    overrides: Partial<CalendarDayType> = {},
  ): CalendarDayType => ({
    date: "2025-01-15",
    day: 15,
    isCurrentMonth: true,
    isToday: false,
    isSaturday: false,
    isSunday: false,
    holidays: [],
    anniversaries: [],
    ...overrides,
  });

  describe("基本表示", () => {
    test("日付が表示される", () => {
      const day = createMockDay({ day: 15 });
      render(<CalendarDay day={day} />);

      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });

  describe("祝日表示", () => {
    test("祝日がある日は🎌アイコンが表示される", () => {
      const day = createMockDay({
        holidays: [{ date: "2025-01-01", name: "元日" }],
      });
      render(<CalendarDay day={day} />);

      expect(screen.getByText("🎌")).toBeInTheDocument();
    });
  });

  describe("記念日表示", () => {
    test("記念日がある日は🎂アイコンが表示される", () => {
      const day = createMockDay({
        anniversaries: [
          { id: 1, name: "誕生日", anniversaryDate: "2025-01-15" },
        ],
      });
      render(<CalendarDay day={day} />);

      expect(screen.getByText("🎂")).toBeInTheDocument();
    });

    test("祝日と記念日が重なる日は両方のアイコンが表示される", () => {
      const day = createMockDay({
        holidays: [{ date: "2025-01-01", name: "元日" }],
        anniversaries: [
          { id: 1, name: "誕生日", anniversaryDate: "2025-01-01" },
        ],
      });
      render(<CalendarDay day={day} />);

      expect(screen.getByText("🎌")).toBeInTheDocument();
      expect(screen.getByText("🎂")).toBeInTheDocument();
    });
  });

  describe("ツールチップ", () => {
    test("イベントがない日はクリックしてもツールチップが表示されない", async () => {
      const user = userEvent.setup();
      const day = createMockDay();
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");
      await user.click(button);

      // ツールチップが表示されない
      expect(screen.queryByText("元日")).not.toBeInTheDocument();
    });

    test("祝日がある日をクリックするとツールチップが表示される", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        holidays: [{ date: "2025-01-01", name: "元日" }],
      });
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("元日")).toBeInTheDocument();
    });

    test("記念日がある日をクリックするとツールチップが表示される", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        anniversaries: [
          { id: 1, name: "誕生日", anniversaryDate: "2025-01-15" },
        ],
      });
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("誕生日")).toBeInTheDocument();
    });

    test("複数の祝日がある日をクリックすると全ての祝日が表示される", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        date: "2025-01-01",
        day: 1,
        holidays: [
          { date: "2025-01-01", name: "元日" },
          { date: "2025-01-01", name: "正月" },
        ],
      });
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("元日")).toBeInTheDocument();
      expect(screen.getByText("正月")).toBeInTheDocument();
    });

    test("複数の記念日がある日をクリックすると全ての記念日が表示される", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        date: "2025-01-15",
        day: 15,
        anniversaries: [
          { id: 1, name: "誕生日", anniversaryDate: "2025-01-15" },
          { id: 2, name: "結婚記念日", anniversaryDate: "2025-01-15" },
        ],
      });
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("誕生日")).toBeInTheDocument();
      expect(screen.getByText("結婚記念日")).toBeInTheDocument();
    });

    test("ツールチップが表示されている状態で再度クリックすると閉じる", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        holidays: [{ date: "2025-01-01", name: "元日" }],
      });
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");

      // 1回目のクリックでツールチップ表示
      await user.click(button);
      expect(screen.getByText("元日")).toBeInTheDocument();

      // 2回目のクリックでツールチップ非表示
      await user.click(button);
      expect(screen.queryByText("元日")).not.toBeInTheDocument();
    });

    test("祝日と記念日が重なる日のツールチップには両方が表示される", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        holidays: [{ date: "2025-01-01", name: "元日" }],
        anniversaries: [
          { id: 1, name: "誕生日", anniversaryDate: "2025-01-01" },
        ],
      });
      render(<CalendarDay day={day} />);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(screen.getByText("元日")).toBeInTheDocument();
      expect(screen.getByText("誕生日")).toBeInTheDocument();
    });

    test("ツールチップが表示されている状態でフォーカスを失うと閉じる", async () => {
      const user = userEvent.setup();
      const day = createMockDay({
        date: "2025-01-01",
        day: 1,
        holidays: [{ date: "2025-01-01", name: "元日" }],
      });
      render(
        <div>
          <CalendarDay day={day} />
          <button type="button">Other Button</button>
        </div>,
      );

      const calendarButton = screen.getByRole("button", { name: /1/ });
      await user.click(calendarButton);

      // ツールチップが表示される
      expect(screen.getByText("元日")).toBeInTheDocument();

      // 別の要素にフォーカスを移動
      const otherButton = screen.getByRole("button", { name: "Other Button" });
      await user.click(otherButton);

      // ツールチップが閉じる
      expect(screen.queryByText("元日")).not.toBeInTheDocument();
    });
  });
});
