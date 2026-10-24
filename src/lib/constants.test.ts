import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { destinationForRole, CAMPUS_DESTINATION, STUDENT_DESTINATION } from "./constants";

// Feature: mood-journal-input, Property 3: Pemetaan role ke tujuan perutean
describe("Property 3: destinationForRole mapping", () => {
  it("campus iff konselor/admin, else student", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom("mahasiswa", "konselor", "admin"),
          fc.string(),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (role) => {
          const dest = destinationForRole(role as string | null | undefined);
          if (role === "konselor" || role === "admin") {
            expect(dest).toBe(CAMPUS_DESTINATION);
          } else {
            expect(dest).toBe(STUDENT_DESTINATION);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
