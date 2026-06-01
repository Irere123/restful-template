import bcrypt from "bcryptjs";

/**
 * bcrypt work factor. 12 is a sane production default (~250ms/hash on modern
 * hardware) — high enough to slow brute force, low enough to not DoS the API.
 */
const SALT_ROUNDS = 12;

/** Hash a plaintext password for storage. */
export const hashPassword = (plain: string): Promise<string> =>
	bcrypt.hash(plain, SALT_ROUNDS);

/** Constant-time comparison of a plaintext password against a stored hash. */
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
	bcrypt.compare(plain, hash);
