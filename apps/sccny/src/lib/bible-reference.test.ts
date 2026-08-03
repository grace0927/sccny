import { describe, expect, it } from "vitest";
import {
  BibleReferenceError,
  type BookName,
  buildBounds,
  cnNumToInt,
  formatRefTitle,
  resolveRef,
  verseKey,
} from "./bible-reference";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BOOKS: BookName[] = [
  { zhName: "创世记", enName: "Genesis", bookNum: 1 },
  { zhName: "诗篇", enName: "Psalms", bookNum: 19 },
  { zhName: "马太福音", enName: "Matthew", bookNum: 40 },
  { zhName: "约翰福音", enName: "John", bookNum: 43 },
  { zhName: "哥林多前书", enName: "1 Corinthians", bookNum: 46 },
  { zhName: "哥林多后书", enName: "2 Corinthians", bookNum: 47 },
  { zhName: "以弗所书", enName: "Ephesians", bookNum: 49 },
  { zhName: "帖撒罗尼迦前书", enName: "1 Thessalonians", bookNum: 52 },
  { zhName: "约翰一书", enName: "1 John", bookNum: 62 },
  { zhName: "启示录", enName: "Revelation", bookNum: 66 },
];

/** Real chapter/verse counts for the books above (only the chapters under test). */
const CHAPTER_SIZES: Record<number, Record<number, number>> = {
  1: { 1: 31, 2: 25 },
  19: Object.fromEntries(
    // Psalms has 150 chapters; give every chapter a plausible length and pin the ones asserted on.
    Array.from({ length: 150 }, (_, i) => [i + 1, i + 1 === 23 ? 6 : i + 1 === 51 ? 19 : 20])
  ),
  40: { 5: 48 },
  43: { 1: 51, 2: 25, 3: 36, 21: 25 },
  46: { 1: 31, 2: 16, 3: 23, 7: 40 },
  47: { 1: 24 },
  49: { 1: 23, 2: 22 },
  52: { 4: 18 },
  62: { 1: 10 },
  66: { 21: 27 },
};

const KEYS: number[] = Object.entries(CHAPTER_SIZES)
  .flatMap(([bookNum, chapters]) =>
    Object.entries(chapters).flatMap(([chapter, lastVerse]) =>
      Array.from({ length: lastVerse }, (_, i) =>
        verseKey(parseInt(bookNum, 10), parseInt(chapter, 10), i + 1)
      )
    )
  )
  .sort((a, b) => a - b);

const BOUNDS = buildBounds(KEYS);

const resolve = (ref: string) => resolveRef(ref, BOOKS, BOUNDS);
const one = (ref: string) => {
  const refs = resolve(ref);
  expect(refs).toHaveLength(1);
  return refs[0];
};

function expectError(ref: string, code: string) {
  try {
    resolve(ref);
  } catch (err) {
    expect(err).toBeInstanceOf(BibleReferenceError);
    expect((err as BibleReferenceError).code).toBe(code);
    return err as BibleReferenceError;
  }
  throw new Error(`expected "${ref}" to throw ${code}, but it resolved`);
}

// ── Cross-chapter ranges (the headline feature) ──────────────────────────────

describe("cross-chapter ranges", () => {
  it("parses 约翰福音1:1-2:2 as chapter 1 verse 1 through chapter 2 verse 2", () => {
    expect(one("约翰福音1:1-2:2")).toMatchObject({
      bookNum: 43,
      startChapter: 1,
      startVerse: 1,
      endChapter: 2,
      endVerse: 2,
      wholeChapter: false,
    });
  });

  it("accepts spaces around the dash", () => {
    expect(one("约翰福音 1:1 - 2:2")).toMatchObject({
      startChapter: 1,
      startVerse: 1,
      endChapter: 2,
      endVerse: 2,
    });
  });

  it("accepts en dash, tilde and 至 as range separators", () => {
    for (const ref of ["约翰福音1:1–2:2", "约翰福音1:1~2:2", "约翰福音1:1至2:2"]) {
      expect(one(ref)).toMatchObject({ startChapter: 1, endChapter: 2, endVerse: 2 });
    }
  });

  it("treats a bare tail number as an end verse when a start verse was given", () => {
    expect(one("约3:16-18")).toMatchObject({
      startChapter: 3,
      startVerse: 16,
      endChapter: 3,
      endVerse: 18,
    });
  });

  it("treats a bare tail number as an end chapter when no start verse was given", () => {
    expect(one("约翰福音1-2")).toMatchObject({
      startChapter: 1,
      startVerse: 1,
      endChapter: 2,
      endVerse: 25,
      wholeChapter: true,
    });
  });

  it("titles cross-chapter ranges with the chapter on both ends", () => {
    const ref = one("约翰福音1:1-2:2");
    expect(formatRefTitle(ref, "zh")).toBe("约翰福音 1:1-2:2");
    expect(formatRefTitle(ref, "en")).toBe("John 1:1-2:2");
  });

  it("titles same-chapter and single-verse refs without a redundant chapter", () => {
    expect(formatRefTitle(one("约3:16-18"), "zh")).toBe("约翰福音 3:16-18");
    expect(formatRefTitle(one("约3:16"), "zh")).toBe("约翰福音 3:16");
  });
});

// ── Existing behaviour that must not regress ─────────────────────────────────

describe("single refs and whole chapters", () => {
  it("resolves a single verse", () => {
    expect(one("约翰福音3:16")).toMatchObject({
      startChapter: 3,
      startVerse: 16,
      endChapter: 3,
      endVerse: 16,
    });
  });

  it("resolves a whole chapter to its full verse span", () => {
    expect(one("诗篇51")).toMatchObject({
      bookNum: 19,
      startChapter: 51,
      startVerse: 1,
      endChapter: 51,
      endVerse: 19,
      wholeChapter: true,
    });
  });

  it("expands Chinese abbreviations", () => {
    expect(one("林前1:18-25")).toMatchObject({ bookNum: 46, startVerse: 18, endVerse: 25 });
    expect(one("弗2:1")).toMatchObject({ bookNum: 49 });
    expect(one("启21:1")).toMatchObject({ bookNum: 66 });
  });

  it("accepts full-width colons and a space between book and chapter", () => {
    expect(one("以弗所书 1：7-8")).toMatchObject({
      bookNum: 49,
      startChapter: 1,
      startVerse: 7,
      endVerse: 8,
    });
  });

  it("normalises 第N章 ordinals, including with a verse range", () => {
    expect(one("哥林多前书第七章")).toMatchObject({ startChapter: 7, wholeChapter: true });
    expect(one("哥林多前书第七章1-40")).toMatchObject({
      startChapter: 7,
      startVerse: 1,
      endVerse: 40,
    });
  });

  it("normalises 章/节 markers", () => {
    expect(one("约翰福音1章1节-2章2节")).toMatchObject({
      startChapter: 1,
      startVerse: 1,
      endChapter: 2,
      endVerse: 2,
    });
  });

  it("normalises 篇 for Psalms without eating the book name", () => {
    expect(one("诗篇第五十一篇")).toMatchObject({ bookNum: 19, startChapter: 51 });
  });

  it("splits multi-range refs and carries the book over", () => {
    const refs = resolve("林前1:18-25, 2:1-8");
    expect(refs).toHaveLength(2);
    expect(refs[0]).toMatchObject({ bookNum: 46, startChapter: 1, startVerse: 18, endVerse: 25 });
    expect(refs[1]).toMatchObject({ bookNum: 46, startChapter: 2, startVerse: 1, endVerse: 8 });
  });

  it("splits on full-width commas and semicolons", () => {
    expect(resolve("林前1:18-25；2:1-8")).toHaveLength(2);
    expect(resolve("林前1:18-25，2:1-8")).toHaveLength(2);
  });
});

// ── Traditional Chinese and numeral variants ─────────────────────────────────

describe("Traditional Chinese and numeral variants", () => {
  it("resolves Traditional book names identically to Simplified", () => {
    const pairs: Array<[string, string]> = [
      ["約翰福音1:1-2:2", "约翰福音1:1-2:2"],
      ["馬太福音5:3", "马太福音5:3"],
      ["啟示錄21:1", "启示录21:1"],
      ["創世記1:1", "创世记1:1"],
      ["詩篇51", "诗篇51"],
      ["以弗所書2:1", "以弗所书2:1"],
    ];
    for (const [trad, simp] of pairs) {
      expect(one(trad)).toEqual(one(simp));
    }
  });

  it("resolves 壹/貳/叁 numeral variants", () => {
    const expected = one("约翰一书1:9");
    expect(one("约翰壹书1:9")).toEqual(expected);
    expect(one("約翰壹書1:9")).toEqual(expected);
  });

  it("resolves Traditional abbreviations via the 後→后 normalisation", () => {
    expect(one("林後1:3")).toEqual(one("林后1:3"));
    expect(one("詩51")).toEqual(one("诗51"));
  });
});

// ── English book names ───────────────────────────────────────────────────────

describe("English book names", () => {
  it("resolves full English names", () => {
    expect(one("John 1:1-2:2")).toEqual(one("约翰福音1:1-2:2"));
    expect(one("Genesis 1:1")).toEqual(one("创世记1:1"));
  });

  it("resolves numbered books with and without a space", () => {
    expect(one("1 Cor 1:18-25")).toEqual(one("林前1:18-25"));
    expect(one("1Cor 1:18-25")).toEqual(one("林前1:18-25"));
    expect(one("I Corinthians 1:18-25")).toEqual(one("林前1:18-25"));
  });

  it("resolves common abbreviations, case-insensitively and with periods", () => {
    expect(one("Ps 23")).toMatchObject({ bookNum: 19, startChapter: 23, endVerse: 6 });
    expect(one("eph 2:1")).toMatchObject({ bookNum: 49 });
    expect(one("Jn. 3:16")).toMatchObject({ bookNum: 43, startVerse: 16 });
    expect(one("Rev 21:1")).toMatchObject({ bookNum: 66 });
  });

  it("carries an English book over to later segments", () => {
    const refs = resolve("1 Cor 1:18-25, 2:1-8");
    expect(refs).toHaveLength(2);
    expect(refs[1]).toMatchObject({ bookNum: 46, startChapter: 2, startVerse: 1, endVerse: 8 });
  });
});

// ── Errors instead of silently wrong verses ──────────────────────────────────

describe("out-of-range references throw", () => {
  it("rejects an end verse past the end of the chapter", () => {
    const err = expectError("约翰福音3:16-99", "VERSE_OUT_OF_RANGE");
    expect(err.message).toContain("36");
  });

  it("rejects a start verse past the end of the chapter", () => {
    expectError("约翰福音3:99", "VERSE_OUT_OF_RANGE");
  });

  it("rejects a chapter past the end of the book", () => {
    const err = expectError("诗篇200:1", "CHAPTER_OUT_OF_RANGE");
    expect(err.message).toContain("150");
  });

  it("rejects an unknown book", () => {
    expectError("Jhnn 3:16", "UNKNOWN_BOOK");
    expectError("火星书1:1", "UNKNOWN_BOOK");
  });

  it("rejects a reversed range", () => {
    expectError("约翰福音2:2-1:1", "REVERSED_RANGE");
  });

  it("rejects a reference with no chapter at all", () => {
    expectError("约翰福音", "UNPARSEABLE");
  });

  it("rejects the whole reference when any segment is invalid", () => {
    expectError("林前1:18-25, 2:1-999", "VERSE_OUT_OF_RANGE");
  });

  it("rejects an out-of-range chapter in a cross-chapter range", () => {
    expectError("帖撒罗尼迦前书4:3-50", "VERSE_OUT_OF_RANGE");
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

describe("buildBounds", () => {
  it("derives the last verse of each chapter and the last chapter of each book", () => {
    expect(BOUNDS.get(43)?.get(1)).toBe(51);
    expect(BOUNDS.get(43)?.get(3)).toBe(36);
    expect(BOUNDS.get(19)?.get(23)).toBe(6);
    expect(BOUNDS.get(19)?.has(151)).toBe(false);
  });
});

describe("cnNumToInt", () => {
  it("parses Chinese numerals up to three digits", () => {
    expect(cnNumToInt("五")).toBe(5);
    expect(cnNumToInt("十")).toBe(10);
    expect(cnNumToInt("十九")).toBe(19);
    expect(cnNumToInt("二十一")).toBe(21);
    expect(cnNumToInt("五十一")).toBe(51);
    expect(cnNumToInt("一百一十九")).toBe(119);
    expect(cnNumToInt("甲")).toBeNull();
  });
});
