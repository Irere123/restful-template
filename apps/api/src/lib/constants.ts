import config from "@api/config";

export const __prod__ = config.nodeEnv === "production";
