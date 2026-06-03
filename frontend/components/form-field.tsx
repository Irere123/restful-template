import type React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A labelled form row with optional hint and inline error. Wraps any control
 * (Input, Select, Textarea, …) and wires up the `htmlFor`/`id` relationship.
 */
export function FormField({
	label,
	htmlFor,
	error,
	hint,
	required,
	className,
	children,
}: {
	label: string;
	htmlFor?: string;
	error?: string;
	hint?: string;
	required?: boolean;
	className?: string;
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label htmlFor={htmlFor}>
				{label}
				{required && <span className="text-destructive-foreground">*</span>}
			</Label>
			{children}
			{error ? (
				<p className="text-destructive-foreground text-xs">{error}</p>
			) : hint ? (
				<p className="text-muted-foreground text-xs">{hint}</p>
			) : null}
		</div>
	);
}
