import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Read version from package.json
const packageJson = JSON.parse(
	fs.readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);

export default defineConfig({
	plugins: [tailwindcss(), tanstackRouter({}), react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	define: {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
	},
});
