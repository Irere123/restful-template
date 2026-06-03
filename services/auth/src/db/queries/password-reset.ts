import { eq, sql } from "drizzle-orm";

import { db } from "@auth/db";
import { type PasswordResetCode, passwordResetCodes } from "@auth/db/schema";

/** Fields needed to persist a freshly issued password-reset code. */
export type CreatePasswordResetCodeInput = {
	id: string;
	userId: string;
	codeHash: string;
	expiresAt: Date;
};

/**
 * Replace any existing reset code for a user with a new one. Only a single
 * active code may exist per user, so the previous row (if any) is deleted in
 * the same transaction.
 */
export const replacePasswordResetCode = async (
	input: CreatePasswordResetCodeInput,
): Promise<PasswordResetCode> => {
	return db.transaction(async (tx) => {
		await tx
			.delete(passwordResetCodes)
			.where(eq(passwordResetCodes.userId, input.userId));
		const [code] = await tx
			.insert(passwordResetCodes)
			.values(input)
			.returning();
		return code!;
	});
};

/** Look up the active reset code for a user, if one exists. */
export const getPasswordResetCodeByUserId = async (
	userId: string,
): Promise<PasswordResetCode | undefined> => {
	return db.query.passwordResetCodes.findFirst({
		where: eq(passwordResetCodes.userId, userId),
	});
};

/** Increment the failed-attempt counter and return the new value. */
export const incrementPasswordResetAttempts = async (
	id: string,
): Promise<number> => {
	const [row] = await db
		.update(passwordResetCodes)
		.set({ attempts: sql`${passwordResetCodes.attempts} + 1` })
		.where(eq(passwordResetCodes.id, id))
		.returning({ attempts: passwordResetCodes.attempts });
	return row?.attempts ?? 0;
};

/** Burn a reset code once it has been consumed or invalidated. */
export const deletePasswordResetCode = async (id: string): Promise<void> => {
	await db.delete(passwordResetCodes).where(eq(passwordResetCodes.id, id));
};
