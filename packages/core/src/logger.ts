import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

export type Logger = winston.Logger;

export interface LoggerOptions {
	/** Service name tagged on every line (e.g. "auth", "gateway"). */
	service: string;
	level?: string;
	/** Colorize output — enable in development, disable for prod log shippers. */
	pretty?: boolean;
}

/**
 * Create a winston logger tagged with the owning service's name. Each
 * microservice instantiates its own via {@link createLogger} so log lines are
 * attributable across the fleet.
 */
export const createLogger = ({
	service,
	level = "info",
	pretty = true,
}: LoggerOptions): Logger => {
	const logFormat = printf((info) => {
		const { level, message, timestamp, stack, service, ...metadata } =
			info as Record<string, unknown>;
		let msg = `${timestamp} [${service}] [${level}] : ${message}`;

		if (Object.keys(metadata).length > 0) {
			msg += ` ${JSON.stringify(metadata)}`;
		}
		if (stack) {
			msg += `\n${stack}`;
		}
		return msg;
	});

	return winston.createLogger({
		level,
		defaultMeta: { service },
		format: combine(
			errors({ stack: true }),
			timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
			pretty ? colorize() : winston.format.uncolorize(),
			logFormat,
		),
		transports: [new winston.transports.Console({ stderrLevels: ["error"] })],
	});
};
