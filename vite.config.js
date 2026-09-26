import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Discover the deferred renderer before serving a development session; late
  // dependency optimization otherwise reloads the page on its first dice roll.
  optimizeDeps: { include: ["react", "react-dom/client", "react-dom", "lucide-react", "@supabase/supabase-js", "three", "cannon-es"] },
  base: process.env.GITHUB_ACTIONS ? "/DND-Charactersheet-Website/" : "/",
});
