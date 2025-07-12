import { defineConfig } from "vite";

export default defineConfig({
	root: "./src",
	publicDir: "../public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		rollupOptions: {
			input: "./src/index.html",
		},
	},
	server: {
		host: true,
		port: 5173,
		watch: {
			usePolling: true,
			interval: 100,
		},
		hmr: {
			port: 5175,
		},
		proxy: {
			"/api": {
				target: "http://localhost:3003",
				changeOrigin: true,
			},
			"/ws": {
				target: "ws://localhost:3003",
				ws: true,
				changeOrigin: true,
			},
		},
	},
	css: {
		postcss: "./postcss.config.js",
	},
});
