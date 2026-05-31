import globals from "globals";

import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for Node.js applications.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nodeConfig = [
	...baseConfig,
	{
		files: ["src/**/*.ts", "src/**/*.js"],
		languageOptions: {
			globals: {
				console: "readonly",
				process: "readonly",
				Buffer: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				global: "readonly",
				fetch: "false",
				...globals.node,
			},
		},
		rules: {
			"no-console": "off",
		},
	},
];

// Default export for backward compatibility
export default nodeConfig;
