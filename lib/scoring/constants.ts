/** Expected number of judges for this event (used for “N / 6” style progress in admin). */
export const EVENT_JUDGE_TARGET = 6;

/** Default number of teams promoted to the staged finals. Admin can pick another N. */
export const EVENT_FINALIST_TARGET = 6;

/** Step 3 pitch rubric. Maxes sum to 100, mirroring ADMIN_SCORE_CRITERIA. */
export const PITCH_CRITERIA = [
  { key: "delivery" as const, label: "Delivery", max: 30 },
  { key: "clarity" as const, label: "Clarity of the idea", max: 30 },
  { key: "impact" as const, label: "Impact", max: 40 },
] as const;
