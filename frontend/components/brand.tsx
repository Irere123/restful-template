import Image from "next/image";
import type React from "react";

import { cn } from "@/lib/utils";

export function Brand({
	className,
	iconOnly = false,
	showSubtitle = true,
}: {
	className?: string;
	iconOnly?: boolean;
	showSubtitle?: boolean;
}): React.ReactElement {
	return (
		<span className={cn("flex items-center gap-2", className)}>
			<Image
				src="/logo.svg"
				alt={iconOnly ? "TZW Fire Safety" : ""}
				width={38}
				height={38}
				unoptimized
				priority
				className="size-9 shrink-0"
			/>
			{!iconOnly && (
				<span className="flex flex-col leading-none">
					<span className="font-heading font-semibold text-sm">
						TZW Fire Safety
					</span>
					{showSubtitle && (
						<span className="text-muted-foreground text-xs">
							Extinguisher Management
						</span>
					)}
				</span>
			)}
		</span>
	);
}
