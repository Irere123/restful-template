"use client";

import { useState } from "react";

import { EnumSelect } from "@/components/enum-select";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogPanel,
	DialogPopup,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
	useCreateExtinguisher,
	useUpdateExtinguisher,
} from "@/lib/api/extinguishers";
import type {
	Extinguisher,
	ExtinguisherSize,
	ExtinguisherStatus,
	ExtinguisherType,
} from "@/lib/api/types";
import { sizeOptions, statusOptions, typeOptions } from "@/lib/options";
import { toast } from "@/lib/toast";
import { extinguisherFormSchema } from "@/lib/validation";

type FormValues = {
	serialNumber: string;
	location: string;
	type: ExtinguisherType | null;
	size: ExtinguisherSize | null;
	installationDate: string;
	expiryDate: string;
	status: ExtinguisherStatus | null;
};

function ExtinguisherForm({
	extinguisher,
	onDone,
}: {
	extinguisher?: Extinguisher;
	onDone: () => void;
}): React.ReactElement {
	const isEdit = Boolean(extinguisher);
	const create = useCreateExtinguisher();
	const update = useUpdateExtinguisher();
	const pending = create.isPending || update.isPending;

	const [values, setValues] = useState<FormValues>({
		serialNumber: extinguisher?.serialNumber ?? "",
		location: extinguisher?.location ?? "",
		type: extinguisher?.type ?? null,
		size: extinguisher?.size ?? null,
		installationDate: extinguisher?.installationDate ?? "",
		expiryDate: extinguisher?.expiryDate ?? "",
		status: extinguisher?.status ?? "active",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set<K extends keyof FormValues>(key: K, value: FormValues[K]): void {
		setValues((v) => ({ ...v, [key]: value }));
		setErrors((e) => ({ ...e, [key]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = extinguisherFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				next[String(issue.path[0])] = issue.message;
			}
			setErrors(next);
			return;
		}

		const onError = (err: unknown): void => {
			if (err instanceof ApiError) {
				if (err.status === 409) {
					setErrors({ serialNumber: "Serial number already in use" });
					return;
				}
				if (Object.keys(err.fieldErrors).length) {
					setErrors(err.fieldErrors);
					return;
				}
			}
			toast.fromError(err);
		};

		if (isEdit && extinguisher) {
			update.mutate(
				{ id: extinguisher.id, input: parsed.data },
				{
					onSuccess: () => {
						toast.success("Extinguisher updated");
						onDone();
					},
					onError,
				},
			);
		} else {
			create.mutate(parsed.data, {
				onSuccess: () => {
					toast.success("Extinguisher registered");
					onDone();
				},
				onError,
			});
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="contents">
			<DialogHeader>
				<DialogTitle>
					{isEdit ? "Edit extinguisher" : "Register extinguisher"}
				</DialogTitle>
				<DialogDescription>
					{isEdit
						? "Update this unit’s details."
						: "Add a new fire extinguisher to the registry."}
				</DialogDescription>
			</DialogHeader>

			<DialogPanel className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="Serial number"
						htmlFor="serialNumber"
						error={errors.serialNumber}
						required
					>
						<Input
							id="serialNumber"
							placeholder="FE-001"
							value={values.serialNumber}
							onChange={(e) => set("serialNumber", e.target.value)}
							aria-invalid={Boolean(errors.serialNumber)}
						/>
					</FormField>
					<FormField
						label="Location"
						htmlFor="location"
						error={errors.location}
						required
					>
						<Input
							id="location"
							placeholder="Building A — Floor 2"
							value={values.location}
							onChange={(e) => set("location", e.target.value)}
							aria-invalid={Boolean(errors.location)}
						/>
					</FormField>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField label="Type" htmlFor="type" error={errors.type} required>
						<EnumSelect
							id="type"
							value={values.type}
							onChange={(v) => set("type", v)}
							options={typeOptions}
							placeholder="Select type"
							ariaInvalid={Boolean(errors.type)}
						/>
					</FormField>
					<FormField label="Size" htmlFor="size" error={errors.size} required>
						<EnumSelect
							id="size"
							value={values.size}
							onChange={(v) => set("size", v)}
							options={sizeOptions}
							placeholder="Select size"
							ariaInvalid={Boolean(errors.size)}
						/>
					</FormField>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="Installation date"
						htmlFor="installationDate"
						error={errors.installationDate}
						required
					>
						<Input
							id="installationDate"
							type="date"
							value={values.installationDate}
							onChange={(e) => set("installationDate", e.target.value)}
							aria-invalid={Boolean(errors.installationDate)}
						/>
					</FormField>
					<FormField
						label="Expiry date"
						htmlFor="expiryDate"
						error={errors.expiryDate}
						required
					>
						<Input
							id="expiryDate"
							type="date"
							value={values.expiryDate}
							onChange={(e) => set("expiryDate", e.target.value)}
							aria-invalid={Boolean(errors.expiryDate)}
						/>
					</FormField>
				</div>

				<FormField label="Status" htmlFor="status" error={errors.status}>
					<EnumSelect
						id="status"
						value={values.status}
						onChange={(v) => set("status", v)}
						options={statusOptions}
						placeholder="Select status"
					/>
				</FormField>
			</DialogPanel>

			<DialogFooter>
				<DialogClose disabled={pending} render={<Button variant="outline" />}>
					Cancel
				</DialogClose>
				<Button type="submit" loading={pending}>
					{isEdit ? "Save changes" : "Register"}
				</Button>
			</DialogFooter>
		</form>
	);
}

export function ExtinguisherFormDialog({
	open,
	onOpenChange,
	extinguisher,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	extinguisher?: Extinguisher;
}): React.ReactElement {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup className="max-w-xl">
				{open && (
					<ExtinguisherForm
						key={extinguisher?.id ?? "new"}
						extinguisher={extinguisher}
						onDone={() => onOpenChange(false)}
					/>
				)}
			</DialogPopup>
		</Dialog>
	);
}
