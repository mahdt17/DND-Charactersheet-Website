import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const liveSubclassIds = new Set([
  "2014:subclass:cleric:twilight",
  "2014:subclass:paladin:redemption",
  "2014:subclass:sorcerer:clockwork-soul",
  "2014:subclass:warlock:hexblade",
  "2014:subclass:wizard:bladesinging",
  "2014:subclass:ranger:gloom-stalker",
  "2014:subclass:fighter:battle-master",
]);

// Keep the full catalog available for development. Build the live application
// with only the reviewed additions; prior subclass records are loaded separately.
const buildLiveSubclassCatalog = {
  name: "live-subclass-catalog",
  enforce: "pre",
  apply: "build",
  transform(source, id) {
    const filename = id.replaceAll("\\", "/");
    const isCatalog = filename.endsWith("/src/data/expandedSubclasses.json");
    const isMechanics = filename.endsWith("/src/data/subclassMechanics2014.json");
    if (!isCatalog && !isMechanics) return;
    return {
      code: JSON.stringify(JSON.parse(source).filter(row => liveSubclassIds.has(isCatalog ? row.id : row.recordId))),
      map: null,
    };
  },
};

export default defineConfig({
  plugins: [buildLiveSubclassCatalog, react()],
  // Discover the deferred renderer before serving a development session; late
  // dependency optimization otherwise reloads the page on its first dice roll.
  optimizeDeps: { include: ["react", "react-dom/client", "react-dom", "lucide-react", "@supabase/supabase-js", "three", "cannon-es"] },
  base: process.env.GITHUB_ACTIONS ? "/DND-Charactersheet-Website/" : "/",
});
