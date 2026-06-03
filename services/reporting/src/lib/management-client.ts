import { serviceRequest } from "@repo/core";
import config from "@reporting/config";
import type {
	Extinguisher,
	Inspection,
	MaintenanceLog,
} from "@reporting/types";

/**
 * Read-only client over the management service. The caller's cookie is
 * forwarded so management enforces the same authentication/RBAC — reporting
 * never sees more than the requesting user is allowed to.
 */

export const fetchExtinguishers = async (
	cookie?: string,
): Promise<Extinguisher[]> => {
	const { extinguishers } = await serviceRequest<{
		extinguishers: Extinguisher[];
	}>(`${config.managementUrl}/extinguishers`, { cookie });
	return extinguishers;
};

export const fetchInspections = async (
	cookie?: string,
): Promise<Inspection[]> => {
	const { inspections } = await serviceRequest<{ inspections: Inspection[] }>(
		`${config.managementUrl}/inspections`,
		{ cookie },
	);
	return inspections;
};

export const fetchMaintenance = async (
	cookie?: string,
): Promise<MaintenanceLog[]> => {
	const { maintenance } = await serviceRequest<{
		maintenance: MaintenanceLog[];
	}>(`${config.managementUrl}/maintenance`, { cookie });
	return maintenance;
};
