import {
	deletePasswordResetCode,
	getPasswordResetCodeByUserId,
	incrementPasswordResetAttempts,
	replacePasswordResetCode,
} from "@auth/db/queries";
import type { User } from "@auth/db/schema";
import { sendPasswordResetEmail } from "@auth/lib/notifications";
import {
	generateOtp,
	hashOtp,
	OTP_MAX_ATTEMPTS,
	otpExpiry,
	verifyOtp,
} from "@auth/lib/otp";
import logger from "@auth/logger";
import { ApiError, generateId } from "@repo/core";

/**
 * Issue (or re-issue) a password-reset code for a user: generate a fresh OTP,
 * persist its hash (replacing any prior code), and ask the notification service
 * to email the plaintext.
 */
export const issuePasswordReset = async (user: User): Promise<void> => {
	const code = generateOtp();

	await replacePasswordResetCode({
		id: await generateId(),
		userId: user.id,
		codeHash: hashOtp(code),
		expiresAt: otpExpiry(),
	});

	await sendPasswordResetEmail(user.email, code, user.displayName);
};

/**
 * Validate a submitted reset OTP for a user and burn it on success. Throws an
 * {@link ApiError} for every failure mode; the caller sets the new password
 * only after this resolves.
 */
export const consumePasswordResetCode = async (
	user: User,
	code: string,
): Promise<void> => {
	const record = await getPasswordResetCodeByUserId(user.id);
	if (!record) {
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "No reset code found. Request a new one.",
		});
	}

	if (record.expiresAt.getTime() < Date.now()) {
		await deletePasswordResetCode(record.id);
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "This code has expired. Request a new one.",
		});
	}

	if (record.attempts >= OTP_MAX_ATTEMPTS) {
		await deletePasswordResetCode(record.id);
		throw new ApiError({
			code: "TOO_MANY_REQUESTS",
			message: "Too many incorrect attempts. Request a new code.",
		});
	}

	if (!verifyOtp(code, record.codeHash)) {
		const attempts = await incrementPasswordResetAttempts(record.id);
		if (attempts >= OTP_MAX_ATTEMPTS) {
			await deletePasswordResetCode(record.id);
		}
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "Invalid reset code",
		});
	}

	await deletePasswordResetCode(record.id);
	logger.info("Password reset code consumed", { userId: user.id });
};
