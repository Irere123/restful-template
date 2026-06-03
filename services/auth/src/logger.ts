import config from "@auth/config";
import { createLogger, type Logger } from "@repo/core";

export const logger: Logger = createLogger({
	service: "auth",
	level: config.logLevel,
	pretty: config.isDevelopment,
});

export default logger;
