"use client";

import { useEffect, useState } from "react";

export type Pagination<T> = {
	page: number;
	pageCount: number;
	pageItems: T[];
	total: number;
	from: number;
	to: number;
	setPage: (page: number) => void;
};

/**
 * Client-side pagination over an in-memory list. Slices `items` into pages of
 * `pageSize` and tracks the current page, clamping it into range as the data
 * changes (e.g. after a row is deleted). Pass `resetKey` — a signature of the
 * active filters/search — to jump back to the first page whenever it changes.
 */
export function usePagination<T>(
	items: T[],
	{ pageSize = 10, resetKey }: { pageSize?: number; resetKey?: unknown } = {},
): Pagination<T> {
	const [page, setPage] = useState(1);

	const total = items.length;
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	// Derive the effective page so a shrinking list never strands the user on a
	// now-empty page without needing an extra render to correct it.
	const current = Math.min(page, pageCount);

	useEffect(() => {
		setPage(1);
	}, [resetKey]);

	const start = (current - 1) * pageSize;
	const pageItems = items.slice(start, start + pageSize);

	return {
		page: current,
		pageCount,
		pageItems,
		total,
		from: total === 0 ? 0 : start + 1,
		to: Math.min(start + pageSize, total),
		setPage,
	};
}
