import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";
import { publicProcedure, router } from "../index";

function getServerVersion(): string {
	try {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));

		// Try multiple paths to find server package.json
		const possiblePaths = [
			path.resolve(__dirname, "../../../../apps/server/package.json"), // from dist
			path.resolve(__dirname, "../../../apps/server/package.json"), // from src
		];

		for (const packagePath of possiblePaths) {
			try {
				const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
				return packageJson.version;
			} catch {
				continue;
			}
		}

		return "unknown";
	} catch (error) {
		console.error("Failed to read server version:", error);
		return "unknown";
	}
}

export const versionRouter = router({
	get: publicProcedure.query(() => {
		return {
			version: getServerVersion(),
		};
	}),
});
