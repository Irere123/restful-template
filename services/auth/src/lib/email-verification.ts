import {
	deleteEmailVerificationCode,
	getEmailVerificationCodeByUserId,
	incrementEmailVerificationAttempts,
	replaceEmailVerificationCode,
	setEmailVerified,
} from "@auth/db/queries";
import type { User } from "@auth/db/schema";
import { sendOtpEmail } from "@auth/lib/notifications";
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
 * Issue (or re-issue) an email verification code for a user: generate a fresh
 * OTP, persist its hash (replacing any prior code), and ask the notification
 * service to email the plaintext.
 *
 * Email delivery failures are surfaced to the caller so the client can be told
 * to retry; the stored code remains valid for a subsequent resend.
 */
export const issueEmailVerification = async (user: User): Promise<void> => {
	const code = generateOtp();

	await replaceEmailVerificationCode({
		id: await generateId(),
		userId: user.id,
		codeHash: hashOtp(code),
		expiresAt: otpExpiry(),
	});

	await sendOtpEmail(user.email, code, user.displayName);
};

/**
 * Verify a submitted OTP for a user and mark their email verified on success.
 *
 * Throws an {@link ApiError} for every failure mode (missing/expired code,
 * too many attempts, wrong code). On a wrong code the attempt counter is
 * bumped and the code is burned once {@link OTP_MAX_ATTEMPTS} is reached.
 */
export const confirmEmailVerification = async (
	user: User,
	code: string,
): Promise<void> => {
	if (user.emailVerified) {
		return;
	}

	const record = await getEmailVerificationCodeByUserId(user.id);
	if (!record) {
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "No verification code found. Request a new one.",
		});
	}

	if (record.expiresAt.getTime() < Date.now()) {
		await deleteEmailVerificationCode(record.id);
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "This code has expired. Request a new one.",
		});
	}

	if (record.attempts >= OTP_MAX_ATTEMPTS) {
		await deleteEmailVerificationCode(record.id);
		throw new ApiError({
			code: "TOO_MANY_REQUESTS",
			message: "Too many incorrect attempts. Request a new code.",
		});
	}

	if (!verifyOtp(code, record.codeHash)) {
		const attempts = await incrementEmailVerificationAttempts(record.id);
		if (attempts >= OTP_MAX_ATTEMPTS) {
			await deleteEmailVerificationCode(record.id);
		}
		throw new ApiError({
			code: "BAD_REQUEST",
			message: "Invalid verification code",
		});
	}

	await deleteEmailVerificationCode(record.id);
	await setEmailVerified(user.id);
	logger.info("Email verified", { userId: user.id });
};
