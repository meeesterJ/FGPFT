/**
 * Export DEFAULT_WORD_LISTS to JSON for the native iOS app.
 * Run: npx tsx script/export-word-lists.ts
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
// @ts-ignore - tsx resolves .ts
import { DEFAULT_WORD_LISTS } from "../client/src/lib/words.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../ios/App/App/Resources/word-lists.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(DEFAULT_WORD_LISTS, null, 2), "utf-8");
console.log("Wrote", outPath);
