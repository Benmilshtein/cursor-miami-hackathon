import * as XLSX from "xlsx";

export type CreditLinkRow = { userId: string | null; url: string };

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function findUserIdColumnIndex(headerRow: string[]): number {
  const labels = ["user_id", "userid", "user", "id"];
  for (let i = 0; i < headerRow.length; i++) {
    const n = normalizeHeader(headerRow[i] ?? "");
    if (labels.includes(n)) return i;
  }
  return -1;
}

function findUrlColumnIndex(headerRow: string[]): number {
  const labels = ["url", "link", "links", "credit_url", "full_url"];
  for (let i = 0; i < headerRow.length; i++) {
    const n = normalizeHeader(headerRow[i] ?? "");
    if (labels.includes(n)) return i;
  }
  return -1;
}

function isHttpUrl(v: string): boolean {
  return v.startsWith("http://") || v.startsWith("https://");
}

/**
 * Parse a credit-link file (CSV or XLSX; SheetJS auto-detects the format).
 *
 * Accepts:
 *  - a `url`/`link` column (and an optional `user_id` column), or
 *  - a bare/headerless list of URLs (any cell starting with http:// or https://).
 *
 * `userId` is optional — links-only files are supported. Dedupes by URL
 * (case-insensitive, first occurrence wins).
 */
export function parseCreditLinkRows(buffer: Buffer): {
  rows: CreditLinkRow[];
  rawRowCount: number;
  dedupedRowCount: number;
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    return { rows: [], rawRowCount: 0, dedupedRowCount: 0 };
  }

  const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number)[][];

  if (data.length === 0) {
    return { rows: [], rawRowCount: 0, dedupedRowCount: 0 };
  }

  const headerRow = data[0]?.map((c) => String(c).trim()) ?? [];
  const userCol = findUserIdColumnIndex(headerRow);
  const urlCol = findUrlColumnIndex(headerRow);

  const raw: CreditLinkRow[] = [];

  if (urlCol >= 0) {
    // Header-based: read the url column (+ optional user_id column) from row 1+.
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      const url = row[urlCol] != null ? String(row[urlCol]).trim() : "";
      if (!url || !isHttpUrl(url)) continue;
      const uid =
        userCol >= 0 && row[userCol] != null ? String(row[userCol]).trim() : "";
      raw.push({ userId: uid || null, url });
    }
  } else {
    // No recognizable url header: treat the whole sheet as a flat list of URLs.
    // Any cell that looks like an http(s) URL is collected (header rows like
    // "url" don't start with http, so they're naturally ignored).
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      for (const cell of row) {
        const v = cell != null ? String(cell).trim() : "";
        if (v && isHttpUrl(v)) raw.push({ userId: null, url: v });
      }
    }
  }

  const rawRowCount = raw.length;

  const seenUrls = new Set<string>();
  const rows: CreditLinkRow[] = [];
  for (const r of raw) {
    const urlKey = r.url.toLowerCase();
    if (seenUrls.has(urlKey)) continue;
    seenUrls.add(urlKey);
    rows.push(r);
  }

  return { rows, rawRowCount, dedupedRowCount: rows.length };
}
