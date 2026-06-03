"use client";

import type React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";

/** A controlled confirmation dialog for destructive or irreversible actions. */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
	loading = false,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: ButtonProps["variant"];
	loading?: boolean;
	onConfirm: () => void;
}): React.ReactElement {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup className="max-w-md" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<DialogFooter>
					<DialogClose disabled={loading} render={<Button variant="outline" />}>
						{cancelLabel}
					</DialogClose>
					<Button loading={loading} onClick={onConfirm} variant={variant}>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogPopup>
		</Dialog>
	);
}
