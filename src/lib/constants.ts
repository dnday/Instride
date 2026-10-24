/** Destination for students and any role that cannot be determined. */
export const STUDENT_DESTINATION = "/dashboard";

/** Destination for konselor/admin. */
export const CAMPUS_DESTINATION = "/campus-dashboard";

/**
 * @deprecated Use destinationForRole or the role-specific constants.
 * Kept as an alias so existing imports do not break.
 */
export const AUTHENTICATED_DESTINATION = CAMPUS_DESTINATION;

/**
 * Returns the post-login destination route based on the user role.
 * konselor/admin maps to CAMPUS_DESTINATION; everything else
 * (mahasiswa, null, undefined, unknown string) maps to STUDENT_DESTINATION.
 */
export function destinationForRole(role: string | null | undefined): string {
  if (role === "konselor" || role === "admin") {
    return CAMPUS_DESTINATION;
  }
  return STUDENT_DESTINATION;
}
