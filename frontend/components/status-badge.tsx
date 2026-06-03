import type React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
	ExtinguisherStatus,
	InspectionResult,
	InspectionStatus,
	UserRole,
} from "@/lib/api/types";
import {
	labelForInspectionResult,
	labelForInspectionStatus,
	labelForRole,
	labelForStatus,
} from "@/lib/format";

type Variant = NonNullable<BadgeProps["variant"]>;

const EXTINGUISHER_VARIANTS: Record<ExtinguisherStatus, Variant> = {
	active: "success",
	maintenance: "warning",
	expired: "error",
	decommissioned: "secondary",
};

const INSPECTION_STATUS_VARIANTS: Record<InspectionStatus, Variant> = {
	scheduled: "info",
	completed: "success",
	cancelled: "secondary",
};

const INSPECTION_RESULT_VARIANTS: Record<InspectionResult, Variant> = {
	pass: "success",
	fail: "error",
	needs_maintenance: "warning",
};

const ROLE_VARIANTS: Record<UserRole, Variant> = {
	admin: "default",
	inspector: "info",
	user: "outline",
};

export function ExtinguisherStatusBadge({
	status,
}: {
	status: ExtinguisherStatus;
}): React.ReactElement {
	return (
		<Badge variant={EXTINGUISHER_VARIANTS[status]}>
			{labelForStatus(status)}
		</Badge>
	);
}

export function InspectionStatusBadge({
	status,
}: {
	status: InspectionStatus;
}): React.ReactElement {
	return (
		<Badge variant={INSPECTION_STATUS_VARIANTS[status]}>
			{labelForInspectionStatus(status)}
		</Badge>
	);
}

export function InspectionResultBadge({
	result,
}: {
	result: InspectionResult | null;
}): React.ReactElement {
	if (!result) return <span className="text-muted-foreground">—</span>;
	return (
		<Badge variant={INSPECTION_RESULT_VARIANTS[result]}>
			{labelForInspectionResult(result)}
		</Badge>
	);
}

export function RoleBadge({ role }: { role: UserRole }): React.ReactElement {
	return <Badge variant={ROLE_VARIANTS[role]}>{labelForRole(role)}</Badge>;
}
