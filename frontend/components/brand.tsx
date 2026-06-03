import { FlameIcon } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";

export function Brand({
	className,
	iconOnly = false,
}: {
	className?: string;
	iconOnly?: boolean;
}): React.ReactElement {
	return (
		<span className={cn("flex items-center gap-2", className)}>
			<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
				<FlameIcon className="size-4.5" />
			</span>
			{!iconOnly && (
				<span className="flex flex-col leading-none">
					<span className="font-heading font-semibold text-sm">
						TZW Fire Safety
					</span>
					<span className="text-muted-foreground text-xs">
						Extinguisher Management
					</span>
				</span>
			)}
		</span>
	);
}
