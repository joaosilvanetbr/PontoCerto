import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig, type PluginOption } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(async ({ command }) => {
  const plugins: PluginOption[] = [react()]

  if (command === "serve") {
    const { default: devServer } = await import("@hono/vite-dev-server")
    plugins.unshift(
      devServer({
        entry: path.resolve(__dirname, "../backend/api/boot.ts"),
        exclude: [/^\/(?!api\/).*$/],
      }),
    )
  }

  return {
    plugins,
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "../backend/contracts"),
      "@db": path.resolve(__dirname, "../backend/db"),
      "db": path.resolve(__dirname, "../backend/db"),
    },
  },
  envDir: path.resolve(__dirname, ".."),
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
  },
  }
})
