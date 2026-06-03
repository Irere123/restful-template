/**
 * @repo/core — shared building blocks for the Fire Extinguisher Management
 * microservices. Consumed as TypeScript source (no build step) via bundler
 * module resolution + tsx.
 */
export * from "./app";
export * from "./docs";
export * from "./env";
export * from "./errors";
export * from "./http";
export * from "./id";
export * from "./logger";
export * from "./middleware";
export * from "./types";
export * from "./validate";

// NOTE: the Express `Request` augmentation lives in `express.d.ts`. It is picked
// up by each project's own `tsconfig` `include` (core includes its own; every
// service ships a one-line `express.d.ts` re-declaring the same fields).
