/**
 * Serialize an array of records to CSV (RFC-4180 quoting). Columns default to
 * the keys of the first row; pass `columns` to fix the order/selection.
 */
export const toCsv = (
	rows: Array<Record<string, unknown>>,
	columns?: string[],
): string => {
	const cols = columns ?? (rows[0] ? Object.keys(rows[0]) : []);

	const escape = (value: unknown): string => {
		const s = value === null || value === undefined ? "" : String(value);
		return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};

	const header = cols.join(",");
	const lines = rows.map((row) => cols.map((c) => escape(row[c])).join(","));
	return [header, ...lines].join("\n");
};
