import type { User } from "@api/db/schema";

/** A user safe to return over the wire — never includes the password hash. */
export type PublicUser = Omit<User, "password">;

/** Strip sensitive fields from a user record before sending it to a client. */
export const sanitizeUser = ({
	password: _password,
	...rest
}: User): PublicUser => rest;
