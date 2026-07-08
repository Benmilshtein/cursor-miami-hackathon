/**
 * Fills de/es from en in lib/i18n.ts via Google Translate (unofficial API).
 * Run: node scripts/fill-i18n-de-es.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { translate } from "@vitalets/google-translate-api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nPath = path.join(__dirname, "..", "lib", "i18n.ts");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseTsString(raw) {
  // raw includes surrounding quotes
  try {
    return JSON.parse(raw.replace(/\n/g, "\\n"));
  } catch {
    return null;
  }
}

async function main() {
  let s = fs.readFileSync(i18nPath, "utf8");

  const tripletRe =
    /en:\s*("(?:\\.|[^"\\])*")\s*,\s*de:\s*("(?:\\.|[^"\\])*")\s*,\s*es:\s*("(?:\\.|[^"\\])*")/g;
  const unique = new Set();
  let m;
  while ((m = tripletRe.exec(s)) !== null) {
    const en = parseTsString(m[1]);
    if (en !== null) unique.add(en);
  }

  const list = [...unique];
  const toDe = new Map();
  const toEs = new Map();

  console.log("Translating", list.length, "unique English strings…");

  for (let i = 0; i < list.length; i++) {
    const text = list[i];
    if (i % 25 === 0) console.log(i, "/", list.length);
    try {
      const [de, es] = await Promise.all([
        translate(text, { to: "de" }),
        translate(text, { to: "es" }),
      ]);
      toDe.set(text, de.text);
      toEs.set(text, es.text);
      await sleep(100);
    } catch (e) {
      console.error("Fail:", text.slice(0, 50), e.message);
      toDe.set(text, text);
      toEs.set(text, text);
    }
  }

  function quote(str) {
    return JSON.stringify(str);
  }

  tripletRe.lastIndex = 0;
  s = s.replace(tripletRe, (full, enQ, _deQ, _esQ) => {
    const en = parseTsString(enQ);
    if (en === null) return full;
    const de = toDe.get(en) ?? en;
    const es = toEs.get(en) ?? en;
    return `en: ${quote(en)}, de: ${quote(de)}, es: ${quote(es)}`;
  });

  fs.writeFileSync(i18nPath, s);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
