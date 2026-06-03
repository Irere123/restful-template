import winston from "winston";

import { config } from "../config";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(
	({ level, message, timestamp, stack, ...metadata }: any) => {
		let msg = `${timestamp} [${level}] : ${message}`;

		if (Object.keys(metadata).length > 0) {
			msg += ` ${JSON.stringify(metadata)}`;
		}

		if (stack) {
			msg += `\n${stack}`;
		}

		return msg;
	},
);

export const logger = winston.createLogger({
	level: config.logLevel,
	format: combine(
		errors({ stack: true }),
		timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
		config.isDevelopment ? colorize() : winston.format.uncolorize(),
		logFormat,
	),
	transports: [
		new winston.transports.Console({
			stderrLevels: ["error"],
		}),
	],
});

export default logger;
