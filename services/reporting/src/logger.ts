import { createLogger, type Logger } from "@repo/core";
import config from "@reporting/config";

export const logger: Logger = createLogger({
	service: "reporting",
	level: config.logLevel,
	pretty: config.isDevelopment,
});

export default logger;
