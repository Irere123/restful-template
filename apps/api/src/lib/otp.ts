import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import config from "@api/config";

export const OTP_LENGTH = 6;

export const OTP_TTL_MINUTES = 10;

export const OTP_MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically-random numeric OTP, zero-padded to
 * {@link OTP_LENGTH} digits (e.g. "042907"). `randomInt` is uniform, avoiding
 * the modulo bias of `Math.random`-based approaches.
 */
export const generateOtp = (): string => {
	const max = 10 ** OTP_LENGTH;
	return randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
};

/**
 * Derive a storable hash of a code. We HMAC with a server-side secret (a
 * "pepper") rather than storing plaintext: because the 6-digit space is tiny,
 * a plain hash would be trivially reversible if the database leaked — the HMAC
 * key keeps it opaque without the secret.
 */
export const hashOtp = (code: string): string =>
	createHmac("sha256", config.accessTokenSecret).update(code).digest("hex");

/** Constant-time comparison of a submitted code against a stored hash. */
export const verifyOtp = (code: string, hash: string): boolean => {
	const expected = Buffer.from(hashOtp(code), "hex");
	const actual = Buffer.from(hash, "hex");
	return expected.length === actual.length && timingSafeEqual(expected, actual);
};

export const otpExpiry = (): Date =>
	new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
