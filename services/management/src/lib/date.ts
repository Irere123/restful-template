/**
 * Date helpers for the scheduled jobs. Extinguisher expiry and inspection
 * scheduled dates are stored as `date` columns (ISO `YYYY-MM-DD` strings), so
 * comparisons are done on date-only strings in UTC to avoid timezone drift.
 */

/** Today's date as an ISO `YYYY-MM-DD` string (UTC). */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/** Add (or subtract) whole days to an ISO date string, returning ISO date. */
export const addDaysIso = (iso: string, days: number): string => {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
};

/**
 * Whole days from `fromIso` to `toIso` (positive when `toIso` is in the future).
 * Used to compute "days remaining"/"days overdue" for alerts.
 */
export const daysBetween = (fromIso: string, toIso: string): number => {
	const a = new Date(`${fromIso}T00:00:00Z`).getTime();
	const b = new Date(`${toIso}T00:00:00Z`).getTime();
	return Math.round((b - a) / 86_400_000);
};
