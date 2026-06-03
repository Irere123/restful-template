import { createLogger, type Logger } from "@repo/core";

import config from "@management/config";

export const logger: Logger = createLogger({
	service: "management",
	level: config.logLevel,
	pretty: config.isDevelopment,
});

export default logger;
