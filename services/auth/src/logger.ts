import config from "@auth/config";
import { createLogger } from "@repo/core";

export const logger = createLogger({
	service: "auth",
	level: config.logLevel,
	pretty: config.isDevelopment,
});

export default logger;
