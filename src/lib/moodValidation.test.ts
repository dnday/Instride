import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { validateMood, MOOD_MESSAGES } from "./moodValidation";

// Feature: mood-journal-input, Property 1: Karakterisasi validasi mood
describe("Property 1: mood validation characterization", () => {
  it("ok iff integer in 1..5, with correct messages", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(null),
          fc.integer(),
          fc.double(),
          fc.constantFrom(1, 2, 3, 4, 5)
        ),
        (mood) => {
          const r = validateMood({ mood: mood as number | null });
          const valid = mood !== null && Number.isInteger(mood) && (mood as number) >= 1 && (mood as number) <= 5;
          expect(r.ok).toBe(valid);
          if (mood === null) {
            expect(r.errors.mood).toBe(MOOD_MESSAGES.moodRequired);
          } else if (!valid) {
            expect(r.errors.mood).toBe(MOOD_MESSAGES.moodRange);
          } else {
            expect(r.errors).toEqual({});
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: mood-journal-input, Property 4: Pesan validator tidak pernah kosong
describe("Property 4: mood error messages are non-empty", () => {
  it("every rejected mood yields a non-empty message", () => {
    fc.assert(
      fc.property(fc.oneof(fc.constant(null), fc.integer(), fc.double()), (mood) => {
        const r = validateMood({ mood: mood as number | null });
        if (!r.ok) {
          expect((r.errors.mood ?? "").trim().length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 200 }
    );
  });
});
