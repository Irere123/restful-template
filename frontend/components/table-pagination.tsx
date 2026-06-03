"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type React from "react";

import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/** A condensed list of page numbers with ellipses around the current page. */
function pageRange(current: number, count: number): (number | string)[] {
	const range: (number | string)[] = [];
	const left = Math.max(2, current - 1);
	const right = Math.min(count - 1, current + 1);

	range.push(1);
	if (left > 2) range.push("ellipsis-start");
	for (let page = left; page <= right; page++) range.push(page);
	if (right < count - 1) range.push("ellipsis-end");
	if (count > 1) range.push(count);

	return range;
}

/**
 * Table footer pairing a "Showing x–y of z" summary with page controls. Renders
 * nothing when there's no data, and hides the pager when there's a single page.
 * Drives the `usePagination` hook — pass its `page`, `pageCount`, `from`, `to`
 * and `total`, and wire `onPageChange` to `setPage`.
 */
export function TablePagination({
	page,
	pageCount,
	total,
	from,
	to,
	onPageChange,
	itemLabel = "results",
	className,
}: {
	page: number;
	pageCount: number;
	total: number;
	from: number;
	to: number;
	onPageChange: (page: number) => void;
	itemLabel?: string;
	className?: string;
}): React.ReactElement | null {
	if (total === 0) return null;

	return (
		<div
			className={cn(
				"flex flex-col-reverse items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row",
				className,
			)}
		>
			<p className="text-muted-foreground text-sm">
				Showing <span className="font-medium text-foreground">{from}</span>–
				<span className="font-medium text-foreground">{to}</span> of{" "}
				<span className="font-medium text-foreground">{total}</span> {itemLabel}
			</p>

			{pageCount > 1 && (
				<Pagination className="mx-0 w-auto justify-end">
					<PaginationContent>
						<PaginationItem>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onPageChange(page - 1)}
								disabled={page <= 1}
								aria-label="Go to previous page"
							>
								<HugeiconsIcon icon={ArrowLeft01Icon} />
								<span className="max-sm:hidden">Previous</span>
							</Button>
						</PaginationItem>

						{pageRange(page, pageCount).map((item) =>
							typeof item === "string" ? (
								<PaginationItem key={item}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={item}>
									<Button
										variant={item === page ? "outline" : "ghost"}
										size="icon-sm"
										onClick={() => onPageChange(item)}
										aria-current={item === page ? "page" : undefined}
										aria-label={`Go to page ${item}`}
									>
										{item}
									</Button>
								</PaginationItem>
							),
						)}

						<PaginationItem>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onPageChange(page + 1)}
								disabled={page >= pageCount}
								aria-label="Go to next page"
							>
								<span className="max-sm:hidden">Next</span>
								<HugeiconsIcon icon={ArrowRight01Icon} />
							</Button>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
}
