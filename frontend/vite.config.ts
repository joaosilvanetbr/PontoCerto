import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    devServer({ entry: path.resolve(__dirname, "../backend/api/boot.ts"), exclude: [/^\/(?!api\/).*$/] }),
    react()],
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
})
