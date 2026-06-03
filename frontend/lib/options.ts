/** Select option lists derived from the API enums + their display labels. */

import type { EnumOption } from "@/components/enum-select";
import {
	EXTINGUISHER_SIZES,
	EXTINGUISHER_STATUSES,
	EXTINGUISHER_TYPES,
	type ExtinguisherSize,
	type ExtinguisherStatus,
	type ExtinguisherType,
	INSPECTION_RESULTS,
	INSPECTION_STATUSES,
	type InspectionResult,
	type InspectionStatus,
	USER_ROLES,
	type UserRole,
} from "@/lib/api/types";
import {
	labelForInspectionResult,
	labelForInspectionStatus,
	labelForRole,
	labelForStatus,
	labelForType,
} from "@/lib/format";

export const typeOptions: EnumOption<ExtinguisherType>[] =
	EXTINGUISHER_TYPES.map((value) => ({ value, label: labelForType(value) }));

export const sizeOptions: EnumOption<ExtinguisherSize>[] =
	EXTINGUISHER_SIZES.map((value) => ({ value, label: value }));

export const statusOptions: EnumOption<ExtinguisherStatus>[] =
	EXTINGUISHER_STATUSES.map((value) => ({
		value,
		label: labelForStatus(value),
	}));

export const inspectionStatusOptions: EnumOption<InspectionStatus>[] =
	INSPECTION_STATUSES.map((value) => ({
		value,
		label: labelForInspectionStatus(value),
	}));

export const inspectionResultOptions: EnumOption<InspectionResult>[] =
	INSPECTION_RESULTS.map((value) => ({
		value,
		label: labelForInspectionResult(value),
	}));

export const roleOptions: EnumOption<UserRole>[] = USER_ROLES.map((value) => ({
	value,
	label: labelForRole(value),
}));
