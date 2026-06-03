import config from "@notification/config";
import { createLogger, type Logger } from "@repo/core";

export const logger: Logger = createLogger({
	service: "notification",
	level: config.logLevel,
	pretty: config.isDevelopment,
});

export default logger;
