import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import type React from "react";

import { cn } from "@/lib/utils";

export function Spinner({
	className,
	...props
}: Omit<HugeiconsIconProps, "icon">): React.ReactElement {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			aria-label="Loading"
			className={cn("animate-spin", className)}
			role="status"
			{...props}
		/>
	);
}
