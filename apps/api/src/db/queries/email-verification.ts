import { eq, sql } from "drizzle-orm";

import { db } from "@api/db";
import {
	type EmailVerificationCode,
	emailVerificationCodes,
} from "@api/db/schema";

/** Fields needed to persist a freshly issued verification code. */
export type CreateEmailVerificationCodeInput = {
	id: string;
	userId: string;
	codeHash: string;
	expiresAt: Date;
};

/**
 * Replace any existing verification code for a user with a new one. Only a
 * single active code may exist per user, so the previous row (if any) is
 * deleted in the same transaction.
 */
export const replaceEmailVerificationCode = async (
	input: CreateEmailVerificationCodeInput,
): Promise<EmailVerificationCode> => {
	return db.transaction(async (tx) => {
		await tx
			.delete(emailVerificationCodes)
			.where(eq(emailVerificationCodes.userId, input.userId));
		const [code] = await tx
			.insert(emailVerificationCodes)
			.values(input)
			.returning();
		return code!;
	});
};

/** Look up the active verification code for a user, if one exists. */
export const getEmailVerificationCodeByUserId = async (
	userId: string,
): Promise<EmailVerificationCode | undefined> => {
	return db.query.emailVerificationCodes.findFirst({
		where: eq(emailVerificationCodes.userId, userId),
	});
};

/** Increment the failed-attempt counter and return the new value. */
export const incrementEmailVerificationAttempts = async (
	id: string,
): Promise<number> => {
	const [row] = await db
		.update(emailVerificationCodes)
		.set({ attempts: sql`${emailVerificationCodes.attempts} + 1` })
		.where(eq(emailVerificationCodes.id, id))
		.returning({ attempts: emailVerificationCodes.attempts });
	return row?.attempts ?? 0;
};

/** Burn a verification code once it has been consumed or invalidated. */
export const deleteEmailVerificationCode = async (
	id: string,
): Promise<void> => {
	await db
		.delete(emailVerificationCodes)
		.where(eq(emailVerificationCodes.id, id));
};
