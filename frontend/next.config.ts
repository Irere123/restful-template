import path from "node:path";
import type { NextConfig } from "next";

const GATEWAY_URL = process.env.API_GATEWAY_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
	turbopack: {
		root: path.join(__dirname, ".."),
	},
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${GATEWAY_URL}/:path*`,
			},
		];
	},
};

export default nextConfig;
