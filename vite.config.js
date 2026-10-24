import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS === "true" ? "/amiweb.demo/" : "/",
  build: {
    rollupOptions: {
      input: { main: "index.html", maskLab: "mask-lab.html", footerLab: "footer-lab.html" },
    },
  },
})
