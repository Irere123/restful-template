"use client";

import { createContext, useContext, useMemo } from "react";

import { useMe } from "@/lib/api/auth";
import type { User, UserRole } from "@/lib/api/types";

type AuthContextValue = {
	user: User | null;
	/** Initial session resolution is still in flight. */
	isLoading: boolean;
	isAuthenticated: boolean;
	/** True only after the session resolves to no user. */
	isUnauthenticated: boolean;
	/** True when any of the given roles matches the current user. */
	hasRole: (...roles: UserRole[]) => boolean;
	isAdmin: boolean;
	/** admin or inspector — the "can manage assets" capability. */
	canManage: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides the current session user to the whole app via React Context, backed
 * by the React Query `me` cache so it stays in sync with login/logout
 * mutations without prop drilling.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
	const { data, isLoading } = useMe();
	const user = data ?? null;

	const value = useMemo<AuthContextValue>(() => {
		const hasRole = (...roles: UserRole[]): boolean =>
			user != null && roles.includes(user.role);
		return {
			user,
			isLoading,
			isAuthenticated: user != null,
			isUnauthenticated: !isLoading && user == null,
			hasRole,
			isAdmin: hasRole("admin"),
			canManage: hasRole("admin", "inspector"),
		};
	}, [user, isLoading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}
