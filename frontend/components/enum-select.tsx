"use client";

import type React from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type EnumOption<T extends string> = { value: T; label: string };

/**
 * A thin wrapper over the base-ui Select for choosing one value from a fixed
 * list of options, with friendly labels and a placeholder.
 */
export function EnumSelect<T extends string>({
	value,
	onChange,
	options,
	placeholder = "Select…",
	id,
	ariaInvalid,
	disabled,
	size,
	className,
}: {
	value: T | null | undefined;
	onChange: (value: T | null) => void;
	options: readonly EnumOption<T>[];
	placeholder?: string;
	id?: string;
	ariaInvalid?: boolean;
	disabled?: boolean;
	size?: "sm" | "default" | "lg";
	className?: string;
}): React.ReactElement {
	const items = Object.fromEntries(options.map((o) => [o.value, o.label]));

	return (
		<Select
			value={value ?? null}
			onValueChange={(v) => onChange(v as T | null)}
			items={items}
			disabled={disabled}
		>
			<SelectTrigger
				id={id}
				aria-invalid={ariaInvalid}
				size={size}
				className={className}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

const ALL_SENTINEL = "__all__";

/** A filter dropdown with a leading "All" option that maps to `undefined`. */
export function FilterSelect<T extends string>({
	value,
	onChange,
	options,
	allLabel = "All",
	size = "sm",
	className,
	ariaLabel,
}: {
	value: T | undefined;
	onChange: (value: T | undefined) => void;
	options: readonly EnumOption<T>[];
	allLabel?: string;
	size?: "sm" | "default" | "lg";
	className?: string;
	ariaLabel?: string;
}): React.ReactElement {
	const items: Record<string, React.ReactNode> = {
		[ALL_SENTINEL]: allLabel,
		...Object.fromEntries(options.map((o) => [o.value, o.label])),
	};

	return (
		<Select
			value={value ?? ALL_SENTINEL}
			onValueChange={(v) => onChange(v === ALL_SENTINEL ? undefined : (v as T))}
			items={items}
		>
			<SelectTrigger size={size} className={className} aria-label={ariaLabel}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL_SENTINEL}>{allLabel}</SelectItem>
				{options.map((o) => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
