"use client";

import { useMemo, useState } from "react";

import { type EnumOption, EnumSelect } from "@/components/enum-select";
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
import { Textarea } from "@/components/ui/textarea";
import { useExtinguishers } from "@/lib/api/extinguishers";
import { useCreateMaintenance } from "@/lib/api/maintenance";
import type { ExtinguisherStatus } from "@/lib/api/types";
import { statusOptions } from "@/lib/options";
import { toast } from "@/lib/toast";
import { maintenanceFormSchema } from "@/lib/validation";

function MaintenanceForm({
	defaultExtinguisherId,
	onDone,
}: {
	defaultExtinguisherId?: string;
	onDone: () => void;
}): React.ReactElement {
	const { data } = useExtinguishers();
	const create = useCreateMaintenance();

	const options = useMemo<EnumOption<string>[]>(
		() =>
			(data ?? []).map((e) => ({
				value: e.id,
				label: `${e.serialNumber} — ${e.location}`,
			})),
		[data],
	);

	const [values, setValues] = useState({
		extinguisherId: defaultExtinguisherId ?? "",
		actionTaken: "",
		maintenanceDate: "",
		issuesIdentified: "",
		notes: "",
		updateStatus: null as ExtinguisherStatus | null,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set<K extends keyof typeof values>(
		key: K,
		value: (typeof values)[K],
	): void {
		setValues((v) => ({ ...v, [key]: value }));
		setErrors((e) => ({ ...e, [key]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = maintenanceFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues)
				next[String(issue.path[0])] = issue.message;
			setErrors(next);
			return;
		}
		create.mutate(
			{
				extinguisherId: parsed.data.extinguisherId,
				actionTaken: parsed.data.actionTaken,
				maintenanceDate: parsed.data.maintenanceDate,
				issuesIdentified: parsed.data.issuesIdentified || undefined,
				notes: parsed.data.notes || undefined,
				updateStatus: parsed.data.updateStatus ?? undefined,
			},
			{
				onSuccess: () => {
					toast.success("Maintenance logged");
					onDone();
				},
				onError: (err) => toast.fromError(err),
			},
		);
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="contents">
			<DialogHeader>
				<DialogTitle>Log maintenance</DialogTitle>
				<DialogDescription>
					Record maintenance carried out on an extinguisher.
				</DialogDescription>
			</DialogHeader>
			<DialogPanel className="space-y-4">
				<FormField
					label="Extinguisher"
					htmlFor="m-extinguisher"
					error={errors.extinguisherId}
					required
				>
					<EnumSelect
						id="m-extinguisher"
						value={values.extinguisherId || null}
						onChange={(v) => set("extinguisherId", v ?? "")}
						options={options}
						placeholder="Select an extinguisher"
						ariaInvalid={Boolean(errors.extinguisherId)}
					/>
				</FormField>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="Action taken"
						htmlFor="actionTaken"
						error={errors.actionTaken}
						required
					>
						<Input
							id="actionTaken"
							placeholder="Recharged, replaced seal…"
							value={values.actionTaken}
							onChange={(e) => set("actionTaken", e.target.value)}
							aria-invalid={Boolean(errors.actionTaken)}
						/>
					</FormField>
					<FormField
						label="Date"
						htmlFor="maintenanceDate"
						error={errors.maintenanceDate}
						required
					>
						<Input
							id="maintenanceDate"
							type="date"
							value={values.maintenanceDate}
							onChange={(e) => set("maintenanceDate", e.target.value)}
							aria-invalid={Boolean(errors.maintenanceDate)}
						/>
					</FormField>
				</div>

				<FormField
					label="Issues identified"
					htmlFor="issuesIdentified"
					hint="Optional"
				>
					<Textarea
						id="issuesIdentified"
						placeholder="Any problems found…"
						value={values.issuesIdentified}
						onChange={(e) => set("issuesIdentified", e.target.value)}
					/>
				</FormField>

				<FormField label="Notes" htmlFor="m-notes" hint="Optional">
					<Textarea
						id="m-notes"
						value={values.notes}
						onChange={(e) => set("notes", e.target.value)}
					/>
				</FormField>

				<FormField
					label="Update status"
					htmlFor="updateStatus"
					hint="Optionally move the unit to a new status."
				>
					<EnumSelect
						id="updateStatus"
						value={values.updateStatus}
						onChange={(v) => set("updateStatus", v)}
						options={statusOptions}
						placeholder="Leave unchanged"
					/>
				</FormField>
			</DialogPanel>
			<DialogFooter>
				<DialogClose
					disabled={create.isPending}
					render={<Button variant="outline" />}
				>
					Cancel
				</DialogClose>
				<Button type="submit" loading={create.isPending}>
					Log maintenance
				</Button>
			</DialogFooter>
		</form>
	);
}

export function MaintenanceFormDialog({
	open,
	onOpenChange,
	defaultExtinguisherId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultExtinguisherId?: string;
}): React.ReactElement {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogPopup className="max-w-lg">
				{open && (
					<MaintenanceForm
						key={defaultExtinguisherId ?? "new"}
						defaultExtinguisherId={defaultExtinguisherId}
						onDone={() => onOpenChange(false)}
					/>
				)}
			</DialogPopup>
		</Dialog>
	);
}
