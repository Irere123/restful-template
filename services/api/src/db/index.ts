import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import config from "@api/config";
import * as schema from "./schema";

const queryClient = postgres(config.databaseUrl);
export const db = drizzle({ client: queryClient, schema });

export type Database = typeof db;
