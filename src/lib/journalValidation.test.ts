import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateJournal, isOverLimit, JOURNAL_CHAR_LIMIT, JOURNAL_MESSAGES } from "./journalValidation";

// Feature: mood-journal-input, Property 2: Karakterisasi validasi jurnal
describe("Property 2: journal validation characterization", () => {
  it("ok iff trimmed length >= 1 and raw length <= limit", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 5200 }), (content) => {
        const r = validateJournal({ content });
        const valid = content.trim().length >= 1 && content.length <= JOURNAL_CHAR_LIMIT;
        expect(r.ok).toBe(valid);
        if (content.trim().length === 0) {
          expect(r.errors.content).toBe(JOURNAL_MESSAGES.contentRequired);
        } else if (content.length > JOURNAL_CHAR_LIMIT) {
          expect(r.errors.content).toBe(JOURNAL_MESSAGES.contentTooLong);
        } else {
          expect(r.errors).toEqual({});
        }
        expect(isOverLimit(content)).toBe(content.length > JOURNAL_CHAR_LIMIT);
      }),
      { numRuns: 200 }
    );
  });

  it("boundary: 5000 ok, 5001 too long", () => {
    expect(validateJournal({ content: "a".repeat(5000) }).ok).toBe(true);
    expect(validateJournal({ content: "a".repeat(5001) }).errors.content).toBe(JOURNAL_MESSAGES.contentTooLong);
    expect(isOverLimit("a".repeat(5000))).toBe(false);
    expect(isOverLimit("a".repeat(5001))).toBe(true);
  });
});

// Feature: mood-journal-input, Property 4: Pesan validator tidak pernah kosong
describe("Property 4: journal error messages are non-empty", () => {
  it("every rejected journal yields a non-empty message", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 5200 }), (content) => {
        const r = validateJournal({ content });
        if (!r.ok) {
          expect((r.errors.content ?? "").trim().length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 }
    );
  });
});
