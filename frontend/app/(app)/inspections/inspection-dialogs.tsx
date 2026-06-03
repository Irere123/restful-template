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
import {
	useCompleteInspection,
	useScheduleInspection,
	useUpdateInspection,
} from "@/lib/api/inspections";
import type { Inspection, InspectionResult } from "@/lib/api/types";
import { inspectionResultOptions } from "@/lib/options";
import { toast } from "@/lib/toast";
import {
	completeInspectionFormSchema,
	scheduleInspectionFormSchema,
} from "@/lib/validation";

function useExtinguisherOptions(): EnumOption<string>[] {
	const { data } = useExtinguishers();
	return useMemo(
		() =>
			(data ?? []).map((e) => ({
				value: e.id,
				label: `${e.serialNumber} — ${e.location}`,
			})),
		[data],
	);
}

// ── Schedule ────────────────────────────────────────────────────────────────

function ScheduleForm({
	defaultExtinguisherId,
	onDone,
}: {
	defaultExtinguisherId?: string;
	onDone: () => void;
}): React.ReactElement {
	const options = useExtinguisherOptions();
	const schedule = useScheduleInspection();

	const [values, setValues] = useState({
		extinguisherId: defaultExtinguisherId ?? "",
		scheduledDate: "",
		scheduledTime: "",
		notes: "",
	});
	const [errors, setErrors] = useState<Record<string, string>>({});

	function set(key: keyof typeof values, value: string): void {
		setValues((v) => ({ ...v, [key]: value }));
		setErrors((e) => ({ ...e, [key]: "" }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = scheduleInspectionFormSchema.safeParse(values);
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues)
				next[String(issue.path[0])] = issue.message;
			setErrors(next);
			return;
		}
		schedule.mutate(
			{
				extinguisherId: parsed.data.extinguisherId,
				scheduledDate: parsed.data.scheduledDate,
				scheduledTime: parsed.data.scheduledTime || undefined,
				notes: parsed.data.notes || undefined,
			},
			{
				onSuccess: () => {
					toast.success(
						"Inspection scheduled",
						"Personnel have been notified.",
					);
					onDone();
				},
				onError: (err) => toast.fromError(err),
			},
		);
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="contents">
			<DialogHeader>
				<DialogTitle>Schedule inspection</DialogTitle>
				<DialogDescription>
					Book an inspection for an extinguisher.
				</DialogDescription>
			</DialogHeader>
			<DialogPanel className="space-y-4">
				<FormField
					label="Extinguisher"
					htmlFor="extinguisherId"
					error={errors.extinguisherId}
					required
				>
					<EnumSelect
						id="extinguisherId"
						value={values.extinguisherId || null}
						onChange={(v) => set("extinguisherId", v ?? "")}
						options={options}
						placeholder="Select an extinguisher"
						ariaInvalid={Boolean(errors.extinguisherId)}
					/>
				</FormField>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField
						label="Date"
						htmlFor="scheduledDate"
						error={errors.scheduledDate}
						required
					>
						<Input
							id="scheduledDate"
							type="date"
							value={values.scheduledDate}
							onChange={(e) => set("scheduledDate", e.target.value)}
							aria-invalid={Boolean(errors.scheduledDate)}
						/>
					</FormField>
					<FormField
						label="Time"
						htmlFor="scheduledTime"
						error={errors.scheduledTime}
						hint="Optional"
					>
						<Input
							id="scheduledTime"
							type="time"
							value={values.scheduledTime}
							onChange={(e) => set("scheduledTime", e.target.value)}
							aria-invalid={Boolean(errors.scheduledTime)}
						/>
					</FormField>
				</div>
				<FormField
					label="Notes"
					htmlFor="notes"
					error={errors.notes}
					hint="Optional"
				>
					<Textarea
						id="notes"
						placeholder="Anything the inspector should know…"
						value={values.notes}
						onChange={(e) => set("notes", e.target.value)}
					/>
				</FormField>
			</DialogPanel>
			<DialogFooter>
				<DialogClose
					disabled={schedule.isPending}
					render={<Button variant="outline" />}
				>
					Cancel
				</DialogClose>
				<Button type="submit" loading={schedule.isPending}>
					Schedule
				</Button>
			</DialogFooter>
		</form>
	);
}

export function ScheduleInspectionDialog({
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
					<ScheduleForm
						key={defaultExtinguisherId ?? "new"}
						defaultExtinguisherId={defaultExtinguisherId}
						onDone={() => onOpenChange(false)}
					/>
				)}
			</DialogPopup>
		</Dialog>
	);
}

// ── Complete ────────────────────────────────────────────────────────────────

function CompleteForm({
	inspection,
	onDone,
}: {
	inspection: Inspection;
	onDone: () => void;
}): React.ReactElement {
	const complete = useCompleteInspection();
	const [result, setResult] = useState<InspectionResult | null>(null);
	const [notes, setNotes] = useState(inspection.notes ?? "");
	const [errors, setErrors] = useState<Record<string, string>>({});

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		const parsed = completeInspectionFormSchema.safeParse({ result, notes });
		if (!parsed.success) {
			const next: Record<string, string> = {};
			for (const issue of parsed.error.issues)
				next[String(issue.path[0])] = issue.message;
			setErrors(next);
			return;
		}
		complete.mutate(
			{
				id: inspection.id,
				input: {
					result: parsed.data.result,
					notes: parsed.data.notes || undefined,
				},
			},
			{
				onSuccess: () => {
					toast.success("Inspection completed");
					onDone();
				},
				onError: (err) => toast.fromError(err),
			},
		);
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="contents">
			<DialogHeader>
				<DialogTitle>Record inspection result</DialogTitle>
				<DialogDescription>
					Log the outcome of this inspection.
				</DialogDescription>
			</DialogHeader>
			<DialogPanel className="space-y-4">
				<FormField
					label="Result"
					htmlFor="result"
					error={errors.result}
					required
				>
					<EnumSelect
						id="result"
						value={result}
						onChange={setResult}
						options={inspectionResultOptions}
						placeholder="Select result"
						ariaInvalid={Boolean(errors.result)}
					/>
				</FormField>
				<FormField label="Notes" htmlFor="completeNotes" hint="Optional">
					<Textarea
						id="completeNotes"
						placeholder="Findings, observations…"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				</FormField>
			</DialogPanel>
			<DialogFooter>
				<DialogClose
					disabled={complete.isPending}
					render={<Button variant="outline" />}
				>
					Cancel
				</DialogClose>
				<Button type="submit" loading={complete.isPending}>
					Save result
				</Button>
			</DialogFooter>
		</form>
	);
}

export function CompleteInspectionDialog({
	inspection,
	onOpenChange,
}: {
	inspection: Inspection | undefined;
	onOpenChange: (open: boolean) => void;
}): React.ReactElement {
	return (
		<Dialog open={Boolean(inspection)} onOpenChange={onOpenChange}>
			<DialogPopup className="max-w-lg">
				{inspection && (
					<CompleteForm
						key={inspection.id}
						inspection={inspection}
						onDone={() => onOpenChange(false)}
					/>
				)}
			</DialogPopup>
		</Dialog>
	);
}

// ── Reschedule ──────────────────────────────────────────────────────────────

function RescheduleForm({
	inspection,
	onDone,
}: {
	inspection: Inspection;
	onDone: () => void;
}): React.ReactElement {
	const update = useUpdateInspection();
	const [values, setValues] = useState({
		scheduledDate: inspection.scheduledDate,
		scheduledTime: inspection.scheduledTime ?? "",
		notes: inspection.notes ?? "",
	});

	function set(key: keyof typeof values, value: string): void {
		setValues((v) => ({ ...v, [key]: value }));
	}

	function handleSubmit(event: React.FormEvent): void {
		event.preventDefault();
		update.mutate(
			{
				id: inspection.id,
				input: {
					scheduledDate: values.scheduledDate,
					scheduledTime: values.scheduledTime || undefined,
					notes: values.notes || undefined,
				},
			},
			{
				onSuccess: () => {
					toast.success("Inspection rescheduled");
					onDone();
				},
				onError: (err) => toast.fromError(err),
			},
		);
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="contents">
			<DialogHeader>
				<DialogTitle>Reschedule inspection</DialogTitle>
				<DialogDescription>Change the date, time or notes.</DialogDescription>
			</DialogHeader>
			<DialogPanel className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<FormField label="Date" htmlFor="rescheduleDate" required>
						<Input
							id="rescheduleDate"
							type="date"
							value={values.scheduledDate}
							onChange={(e) => set("scheduledDate", e.target.value)}
						/>
					</FormField>
					<FormField label="Time" htmlFor="rescheduleTime" hint="Optional">
						<Input
							id="rescheduleTime"
							type="time"
							value={values.scheduledTime}
							onChange={(e) => set("scheduledTime", e.target.value)}
						/>
					</FormField>
				</div>
				<FormField label="Notes" htmlFor="rescheduleNotes" hint="Optional">
					<Textarea
						id="rescheduleNotes"
						value={values.notes}
						onChange={(e) => set("notes", e.target.value)}
					/>
				</FormField>
			</DialogPanel>
			<DialogFooter>
				<DialogClose
					disabled={update.isPending}
					render={<Button variant="outline" />}
				>
					Cancel
				</DialogClose>
				<Button type="submit" loading={update.isPending}>
					Save
				</Button>
			</DialogFooter>
		</form>
	);
}

export function RescheduleInspectionDialog({
	inspection,
	onOpenChange,
}: {
	inspection: Inspection | undefined;
	onOpenChange: (open: boolean) => void;
}): React.ReactElement {
	return (
		<Dialog open={Boolean(inspection)} onOpenChange={onOpenChange}>
			<DialogPopup className="max-w-lg">
				{inspection && (
					<RescheduleForm
						key={inspection.id}
						inspection={inspection}
						onDone={() => onOpenChange(false)}
					/>
				)}
			</DialogPopup>
		</Dialog>
	);
}
