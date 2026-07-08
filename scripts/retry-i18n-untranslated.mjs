/**
 * Retries translation for triplets where de/es still match English (rate-limit fallback).
 * Sequential, slow. Run: node scripts/retry-i18n-untranslated.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { translate } from "@vitalets/google-translate-api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const i18nPath = path.join(__dirname, "..", "lib", "i18n.ts");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseTsString(raw) {
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

  const needsRetry = new Map(); // en -> { deQ, esQ } first occurrence

  let m;
  while ((m = tripletRe.exec(s)) !== null) {
    const en = parseTsString(m[1]);
    const de = parseTsString(m[2]);
    const es = parseTsString(m[3]);
    if (en === null || de === null || es === null) continue;
    if (en === de && en === es && en.length > 0) {
      needsRetry.set(en, true);
    }
  }

  const list = [...needsRetry.keys()];
  console.log("Retrying", list.length, "strings (en===de===es)…");

  const toDe = new Map();
  const toEs = new Map();

  for (let i = 0; i < list.length; i++) {
    const text = list[i];
    console.log(i + 1, "/", list.length, text.slice(0, 50));
    try {
      const de = await translate(text, { to: "de" });
      await sleep(400);
      const es = await translate(text, { to: "es" });
      await sleep(400);
      toDe.set(text, de.text);
      toEs.set(text, es.text);
    } catch (e) {
      console.error("Fail:", e.message);
      await sleep(2000);
    }
  }

  function quote(str) {
    return JSON.stringify(str);
  }

  tripletRe.lastIndex = 0;
  s = s.replace(tripletRe, (full, enQ, deQ, esQ) => {
    const en = parseTsString(enQ);
    const de = parseTsString(deQ);
    const es = parseTsString(esQ);
    if (en === null) return full;
    if (en !== de || en !== es) return full;
    const newDe = toDe.get(en);
    const newEs = toEs.get(en);
    if (!newDe || !newEs) return full;
    return `en: ${quote(en)}, de: ${quote(newDe)}, es: ${quote(newEs)}`;
  });

  fs.writeFileSync(i18nPath, s);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
