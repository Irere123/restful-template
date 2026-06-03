"use client";

import type React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import type { UserRole } from "@/lib/api/types";

/**
 * Renders `children` only when the current user holds one of `roles`. Used to
 * hide actions the API would reject anyway (the server still enforces RBAC).
 */
export function RoleGate({
	roles,
	fallback = null,
	children,
}: {
	roles: UserRole[];
	fallback?: React.ReactNode;
	children: React.ReactNode;
}): React.ReactElement {
	const { hasRole } = useAuth();
	return <>{hasRole(...roles) ? children : fallback}</>;
}
