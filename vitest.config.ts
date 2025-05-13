import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tsconfigPaths(), react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./vitest.setup.tsx",
		coverage: {
			// you can include other reporters, but 'json-summary' is required, json is recommended
			reporter: ["text", "json-summary", "json"],
			// If you want a coverage reports even if your tests are failing, include the reportOnFailure option
			reportOnFailure: true,
			exclude: ["src/trpc/routers/_app.ts"],
		},
		exclude: [
			"src/trpc/routers/_app.ts", // Ignore specific file
			"**/__tests__/helpers/**", // Ignore a folder
			"**/node_modules/**",
			"**/dist/**",
			"**/.{idea,git,cache,output,temp}/**",
		],
	},
});
