import dayjs from "dayjs";
import ja from "dayjs/locale/ja";
import { describe, expect, it } from "vitest";
import { japanDate } from "@/lib/utils/japanDate";

dayjs.locale(ja);

/**
 * 年度一覧ページの年度計算ロジックのテスト
 * 仕様: 年度は12/31基準で元年が表示されるようにしています
 */
describe("年度計算ロジック", () => {
  // Yearsページと同じロジック
  const startDayOfNendo = (year: number) => {
    return dayjs(`${year.toString()}-04-01`).format("YYYY-MM-DD");
  };

  const endDayOfNendo = (year: number) => {
    const nextYear = year + 1;
    return dayjs(`${nextYear.toString()}-03-31`).format("YYYY-MM-DD");
  };

  const endOfYear = (year: number) => {
    return dayjs().set("year", year).endOf("year").format("YYYY-MM-DD");
  };

  describe("年度の開始・終了日", () => {
    it("年度開始日は4月1日", () => {
      expect(startDayOfNendo(2025)).toBe("2025-04-01");
      expect(startDayOfNendo(2019)).toBe("2019-04-01");
      expect(startDayOfNendo(1989)).toBe("1989-04-01");
    });

    it("年度終了日は翌年3月31日", () => {
      expect(endDayOfNendo(2025)).toBe("2026-03-31");
      expect(endDayOfNendo(2019)).toBe("2020-03-31");
      expect(endDayOfNendo(1989)).toBe("1990-03-31");
    });
  });

  describe("12/31基準の和暦変換", () => {
    it("endOfYearは12月31日を返す", () => {
      expect(endOfYear(2025)).toBe("2025-12-31");
      expect(endOfYear(2019)).toBe("2019-12-31");
      expect(endOfYear(1989)).toBe("1989-12-31");
      expect(endOfYear(1926)).toBe("1926-12-31");
    });

    it("令和元年度: 2019年度は令和元年度", () => {
      // 2019-12-31 → 令和元年（2019年5月1日～）
      const date = endOfYear(2019);
      expect(japanDate(date, true)).toBe("令和元年");
    });

    it("令和2年度: 2020年度は令和2年度", () => {
      const date = endOfYear(2020);
      expect(japanDate(date, true)).toBe("令和2年");
    });

    it("平成元年度: 1989年度は平成元年度", () => {
      // 1989-12-31 → 平成元年（1989年1月8日～）
      const date = endOfYear(1989);
      expect(japanDate(date, true)).toBe("平成元年");
    });

    it("平成31年度: 2018年度は平成30年度", () => {
      // 2018-12-31 → 平成30年（2019年4月30日まで平成）
      const date = endOfYear(2018);
      expect(japanDate(date, true)).toBe("平成30年");
    });

    it("昭和元年度: 1926年度は昭和元年度", () => {
      // 1926-12-31 → 昭和元年（1926年12月25日～）
      const date = endOfYear(1926);
      expect(japanDate(date, true)).toBe("昭和元年");
    });

    it("昭和64年度: 1988年度は昭和63年度", () => {
      // 1988-12-31 → 昭和63年（1989年1月7日まで昭和）
      const date = endOfYear(1988);
      expect(japanDate(date, true)).toBe("昭和63年");
    });

    it("大正元年度: 1912年度は大正元年度", () => {
      // 1912-12-31 → 大正元年（1912年7月30日～）
      const date = endOfYear(1912);
      expect(japanDate(date, true)).toBe("大正元年");
    });

    it("明治33年度: 1900年度は明治33年度", () => {
      const date = endOfYear(1900);
      expect(japanDate(date, true)).toBe("明治33年");
    });
  });

  describe("表示フォーマット", () => {
    it("年度表示: japanDate + '度'", () => {
      const year = 2025;
      const nendoDisplay = `${japanDate(endOfYear(year), true)}度`;
      expect(nendoDisplay).toBe("令和7年度");
    });

    it("開始日表示: YYYY年M月", () => {
      const startDisplay = dayjs(startDayOfNendo(2025)).format("YYYY年M月");
      expect(startDisplay).toBe("2025年4月");
    });

    it("終了日表示: YYYY年M月", () => {
      const endDisplay = dayjs(endDayOfNendo(2025)).format("YYYY年M月");
      expect(endDisplay).toBe("2026年3月");
    });
  });

  describe("エッジケース", () => {
    it("1900年度: 明治33年度", () => {
      const date = endOfYear(1900);
      expect(japanDate(date, true)).toBe("明治33年");
    });

    it("現在年度が正しく計算される", () => {
      const currentYear = dayjs().year();
      const date = endOfYear(currentYear);
      // 現在年の12/31の和暦が取得できることを確認
      const result = japanDate(date, true);
      expect(result).toMatch(/^(令和|平成|昭和|大正|明治)\d+年$/);
    });

    it("連続する年度が正しく計算される", () => {
      // 2018年度、2019年度、2020年度
      expect(japanDate(endOfYear(2018), true)).toBe("平成30年");
      expect(japanDate(endOfYear(2019), true)).toBe("令和元年");
      expect(japanDate(endOfYear(2020), true)).toBe("令和2年");
    });

    it("昭和から平成への移行が正しい", () => {
      // 1988年度（昭和63年）、1989年度（平成元年）
      expect(japanDate(endOfYear(1988), true)).toBe("昭和63年");
      expect(japanDate(endOfYear(1989), true)).toBe("平成元年");
    });

    it("平成から令和への移行が正しい", () => {
      // 2018年度（平成30年）、2019年度（令和元年）
      expect(japanDate(endOfYear(2018), true)).toBe("平成30年");
      expect(japanDate(endOfYear(2019), true)).toBe("令和元年");
    });
  });
});
