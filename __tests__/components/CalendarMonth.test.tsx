import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { CalendarMonth } from "@/components/CalendarMonth";
import type { CalendarDay } from "@/lib/types/calendar";

describe("CalendarMonth", () => {
  const mockGrid: CalendarDay[] = [
    // 第1週
    {
      date: "2024-12-29",
      day: 29,
      isCurrentMonth: false,
      isToday: false,
      isFriday: false,
      isSaturday: false,
      isSunday: true,
      holidays: [],
      anniversaries: [],
    },
    {
      date: "2024-12-30",
      day: 30,
      isCurrentMonth: false,
      isToday: false,
      isFriday: false,
      isSaturday: false,
      isSunday: false,
      holidays: [],
      anniversaries: [],
    },
    {
      date: "2024-12-31",
      day: 31,
      isCurrentMonth: false,
      isToday: false,
      isFriday: false,
      isSaturday: false,
      isSunday: false,
      holidays: [],
      anniversaries: [],
    },
    {
      date: "2025-01-01",
      day: 1,
      isCurrentMonth: true,
      isToday: false,
      isFriday: false,
      isSaturday: false,
      isSunday: false,
      holidays: [{ date: "2025-01-01", name: "元日" }],
      anniversaries: [],
    },
    {
      date: "2025-01-02",
      day: 2,
      isCurrentMonth: true,
      isToday: false,
      isFriday: false,
      isSaturday: false,
      isSunday: false,
      holidays: [],
      anniversaries: [],
    },
    {
      date: "2025-01-03",
      day: 3,
      isCurrentMonth: true,
      isToday: false,
      isFriday: true,
      isSaturday: false,
      isSunday: false,
      holidays: [],
      anniversaries: [],
    },
    {
      date: "2025-01-04",
      day: 4,
      isCurrentMonth: true,
      isToday: false,
      isFriday: false,
      isSaturday: true,
      isSunday: false,
      holidays: [],
      anniversaries: [],
    },
    // 残りの35日（簡略化）
    ...Array.from({ length: 35 }, (_, i) => ({
      date: `2025-01-${String(i + 5).padStart(2, "0")}`,
      day: i + 5,
      isCurrentMonth: i + 5 <= 31,
      isToday: false,
      isFriday: false,
      isSaturday: false,
      isSunday: false,
      holidays: [] as { date: string; name: string }[],
      anniversaries: [] as {
        id: number;
        name: string;
        anniversaryDate: string;
        collectionName: string;
      }[],
    })),
  ];

  test("月のヘッダーが表示される", () => {
    render(<CalendarMonth month={1} grid={mockGrid} />);

    expect(screen.getByRole("heading", { name: "1月" })).toBeInTheDocument();
  });

  test("曜日ヘッダーが正しい順序で表示される", () => {
    render(<CalendarMonth month={1} grid={mockGrid} />);

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    weekdays.forEach((weekday) => {
      expect(screen.getByText(weekday)).toBeInTheDocument();
    });
  });
});
