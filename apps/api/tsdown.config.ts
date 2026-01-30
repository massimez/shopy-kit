import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		hc: "src/lib/hc/hc.ts",
		schema: "src/lib/hc/schema.ts",
	},
	dts: {
		resolve: false,
		compilerOptions: {
			declaration: true,
			declarationMap: !isProduction,
			skipLibCheck: false,
			preserveValueImports: true,
			composite: true,
		},
	},
	sourcemap: !isProduction,
	minify: isProduction,
	clean: true,
});
