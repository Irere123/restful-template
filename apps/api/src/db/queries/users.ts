import { eq } from "drizzle-orm";

import { Database } from "@api/db";
import { users } from "@api/db/schema";

export function getUserById(db: Database, id: string) {
	return db.query.users.findFirst({
		where: eq(users.id, id),
	});
}

export function getUserByEmail(db: Database, email: string) {
	return db.query.users.findFirst({ where: eq(users.email, email) });
}
