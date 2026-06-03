import { createLogger, type Logger } from "@repo/core";

import config from "@gateway/config";

export const logger: Logger = createLogger({
	service: "gateway",
	level: config.logLevel,
	pretty: config.isDevelopment,
});

export default logger;
