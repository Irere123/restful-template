import { TriangleAlertIcon } from "lucide-react";
import type React from "react";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/toast";

/**
 * Renders the right thing for a query's lifecycle: a loader while pending, an
 * error panel with retry, an empty state, or the children once data is ready.
 */
export function DataState({
	isLoading,
	isError,
	error,
	onRetry,
	isEmpty = false,
	loading,
	emptyTitle = "Nothing here yet",
	emptyDescription,
	emptyMedia,
	emptyAction,
	children,
}: {
	isLoading: boolean;
	isError: boolean;
	error?: unknown;
	onRetry?: () => void;
	isEmpty?: boolean;
	loading?: React.ReactNode;
	emptyTitle?: string;
	emptyDescription?: string;
	emptyMedia?: React.ReactNode;
	emptyAction?: React.ReactNode;
	children: React.ReactNode;
}): React.ReactElement {
	if (isLoading) {
		return (
			<>
				{loading ?? (
					<div className="flex items-center justify-center py-16 text-muted-foreground">
						<Spinner className="size-5" />
					</div>
				)}
			</>
		);
	}

	if (isError) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<TriangleAlertIcon className="text-destructive" />
					</EmptyMedia>
					<EmptyTitle>Couldn’t load this</EmptyTitle>
					<EmptyDescription>{errorMessage(error)}</EmptyDescription>
				</EmptyHeader>
				{onRetry && (
					<Button onClick={onRetry} variant="outline" size="sm">
						Try again
					</Button>
				)}
			</Empty>
		);
	}

	if (isEmpty) {
		return (
			<Empty>
				<EmptyHeader>
					{emptyMedia && <EmptyMedia variant="icon">{emptyMedia}</EmptyMedia>}
					<EmptyTitle>{emptyTitle}</EmptyTitle>
					{emptyDescription && (
						<EmptyDescription>{emptyDescription}</EmptyDescription>
					)}
				</EmptyHeader>
				{emptyAction}
			</Empty>
		);
	}

	return <>{children}</>;
}
