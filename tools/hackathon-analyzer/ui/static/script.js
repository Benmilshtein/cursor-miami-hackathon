async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

function flagChip(value) {
  const v = Number(value);
  if (v === 0 || value === false) return '<span class="flag ok">No</span>';
  return '<span class="flag danger">Yes</span>';
}

function hasAnyFlag(row) {
  return (
    Number(row.has_commits_before_t0) > 0 ||
    Number(row.has_bulk_commits) > 0 ||
    Number(row.has_large_initial_commit_after_t0) > 0 ||
    Number(row.has_merge_commits) > 0
  );
}

function formatNumber(num) {
  const n = Number(num) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function updateStats(rows) {
  const total = rows.length;
  const flagged = rows.filter(hasAnyFlag).length;
  const clean = total - flagged;
  
  // Calculate total commits and LoC
  const totalCommits = rows.reduce((sum, r) => sum + (Number(r.total_commits) || 0), 0);
  const totalLocAdded = rows.reduce((sum, r) => sum + (Number(r.total_loc_added) || 0), 0);
  const totalLocDeleted = rows.reduce((sum, r) => sum + (Number(r.total_loc_deleted) || 0), 0);
  const totalLoc = totalLocAdded + totalLocDeleted;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-flagged").textContent = flagged;
  document.getElementById("stat-clean").textContent = clean;
  document.getElementById("stat-commits").textContent = formatNumber(totalCommits);
  document.getElementById("stat-loc").textContent = formatNumber(totalLoc);
}

function extractRepoName(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+?)(?:\.git)?$/);
  if (match) return match[1];
  return repoUrl;
}

// Judge data cache
let judgeMap = new Map();

function normalizeRepoKey(repoUrl = "") {
  return repoUrl.trim().replace(/\.git$/i, "").toLowerCase();
}

async function loadJudgeData() {
  try {
    const data = await fetchJSON("/api/judges");
    const map = new Map();
    if (data && data.by_repo) {
      for (const [repoUrl, info] of Object.entries(data.by_repo)) {
        const key = normalizeRepoKey(repoUrl);
        map.set(key, info);
        // Also store raw repoUrl as-is for exact matches
        map.set(normalizeRepoKey(repoUrl.replace(/\.git$/i, "")), info);
      }
    }
    judgeMap = map;
  } catch (err) {
    console.error("Failed to load judge data", err);
    judgeMap = new Map();
  }
}

// Cache for AI summaries
const aiCache = new Map();

async function fetchAISummary(repoId) {
  if (aiCache.has(repoId)) return aiCache.get(repoId);
  const text = await fetchText(`/api/repo/${repoId}/ai`);
  aiCache.set(repoId, text);
  return text;
}

function getAIPreview(aiText) {
  if (!aiText) return '<span class="ai-preview no-data">No AI analysis</span>';
  // Get first two sentences or first 150 chars
  const sentences = aiText.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  const preview = sentences.length > 180 ? sentences.slice(0, 180) + '…' : sentences;
  return `<span class="ai-preview">${escapeHtml(preview)}</span>`;
}

function extractVerdict(aiText) {
  if (!aiText) return { icon: '⏳', class: 'pending', full: 'Pending analysis' };
  
  const verdictMatch = aiText.match(/Overall authenticity assessment:\s*(.+?)$/mi);
  if (!verdictMatch) return { icon: '⏳', class: 'pending', full: 'No assessment found' };
  
  const verdict = verdictMatch[1].trim();
  const isAuthentic = /consistent|authentic|legitimate/i.test(verdict);
  const isSuspicious = /suspicious|concern|flag|issue|question/i.test(verdict);
  
  if (isSuspicious) {
    return { icon: '⚠️', class: 'suspicious', full: verdict };
  } else if (isAuthentic) {
    return { icon: '✅', class: 'authentic', full: verdict };
  }
  return { icon: '➖', class: 'neutral', full: verdict };
}

function getVerdictBadge(aiText) {
  const verdict = extractVerdict(aiText);
  return `<span class="verdict-icon ${verdict.class}" title="${escapeHtml(verdict.full)}">${verdict.icon}</span>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return (text || "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getJudgeInfoForRow(row) {
  if (!row) return null;
  const key = normalizeRepoKey(row.repo || "");
  return judgeMap.get(key) || judgeMap.get(normalizeRepoKey(row.repo || "").replace(/\.git$/i, ""));
}

function buildJudgeTooltip(info) {
  if (!info || !info.responses || info.responses.length === 0) return "No judge responses";
  const parts = info.responses.map((r, idx) => {
    const thought = r.thoughts ? ` — ${r.thoughts}` : "";
    return `#${idx + 1}: ${r.score}${thought}`;
  });
  return parts.join("\n");
}

function renderJudgeCell(info) {
  if (!info || !info.responses || info.responses.length === 0) {
    return '<span class="judge-chip no-data">—</span>';
  }
  const avg = Number(info.average_score || 0).toFixed(1);
  const tooltip = escapeAttr(buildJudgeTooltip(info));
  return `<span class="judge-chip" title="${tooltip}">${avg}<span class="judge-count">/${info.responses.length}</span></span>`;
}

function renderJudgeDetails(info) {
  const container = document.getElementById("judge-output");
  if (!info || !info.responses || info.responses.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🧑‍⚖️</div><div>No judge responses</div></div>';
    return;
  }
  const avg = Number(info.average_score || 0).toFixed(1);
  const list = info.responses
    .map((r, idx) => {
      const thought = r.thoughts ? `<div class="judge-thought">${escapeHtml(r.thoughts)}</div>` : "";
      return `<div class="judge-row"><div class="judge-score-pill">#${idx + 1} • ${r.score}</div>${thought}</div>`;
    })
    .join("");
  container.innerHTML = `
    <div class="judge-summary">
      <div class="judge-score-pill highlight">${avg}</div>
      <div class="judge-meta">${info.responses.length} response${info.responses.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="judge-list">${list}</div>
  `;
}

async function renderSummaryTable(rows) {
  const tbody = document.querySelector("#summary-table tbody");
  tbody.innerHTML = "";
  const filterPre = document.querySelector("#filter-preT0").checked;
  const filterBulk = document.querySelector("#filter-bulk").checked;
  const filterMerge = document.querySelector("#filter-merge").checked;
  const sortMode = document.querySelector("#sort-select").value;

  const filteredRows = rows.filter((r) => {
    if (filterPre && Number(r.has_commits_before_t0) === 0) return false;
    if (filterBulk && Number(r.has_bulk_commits) === 0) return false;
    if (filterMerge && Number(r.has_merge_commits) === 0) return false;
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortMode === "judge") {
      const ja = getJudgeInfoForRow(a);
      const jb = getJudgeInfoForRow(b);
      const avga = ja && ja.average_score != null ? Number(ja.average_score) : -Infinity;
      const avgb = jb && jb.average_score != null ? Number(jb.average_score) : -Infinity;
      if (avga === avgb) return 0;
      return avgb - avga;
    }
    if (sortMode === "commits") {
      return Number(b.total_commits || 0) - Number(a.total_commits || 0);
    }
    return 0;
  });

  updateStats(rows);

  if (sortedRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11">
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div>No submissions match the current filters</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Render rows first with loading placeholders for AI
  sortedRows.forEach((row) => {
    const tr = document.createElement("tr");
    const repoId = row.repo_id || extractRepoName(row.repo);
    const displayName = row.repo_id || extractRepoName(row.repo);
    const judgeInfo = getJudgeInfoForRow(row);
    
    tr.innerHTML = `
      <td>
        <div class="repo-cell">
          <span class="repo-name">${escapeHtml(displayName)}</span>
          <span class="repo-url">${escapeHtml(row.repo)}</span>
        </div>
      </td>
      <td><div class="judge-cell">${renderJudgeCell(judgeInfo)}</div></td>
      <td><span class="num-cell">${row.total_commits}</span></td>
      <td><span class="num-cell loc-add">+${formatNumber(row.total_loc_added)}</span></td>
      <td><span class="num-cell loc-del">−${formatNumber(row.total_loc_deleted)}</span></td>
      <td style="text-align:center">${flagChip(row.has_commits_before_t0)}</td>
      <td style="text-align:center">${flagChip(row.has_bulk_commits)}</td>
      <td style="text-align:center">${flagChip(row.has_large_initial_commit_after_t0)}</td>
      <td style="text-align:center">${flagChip(row.has_merge_commits)}</td>
      <td class="verdict-cell"><span class="verdict-icon pending">⏳</span></td>
      <td class="ai-cell"><span class="ai-preview no-data">Loading...</span></td>
    `;
    tr.dataset.repoId = repoId;
    tr.addEventListener("click", () => {
      document.querySelectorAll("#summary-table tbody tr").forEach((r) => r.classList.remove("selected"));
      tr.classList.add("selected");
      openDrawer(repoId);
    });
    tbody.appendChild(tr);

    // Fetch AI summary async
    fetchAISummary(repoId).then(aiText => {
      const aiCell = tr.querySelector('.ai-cell');
      const verdictCell = tr.querySelector('.verdict-cell');
      if (aiCell) aiCell.innerHTML = getAIPreview(aiText);
      if (verdictCell) verdictCell.innerHTML = getVerdictBadge(aiText);
    });
  });
}

async function loadSummary() {
  const [summaryData] = await Promise.all([
    fetchJSON("/api/summary"),
    loadJudgeData(),
  ]);
  window.__summaryRows = summaryData.rows || [];
  await renderSummaryTable(window.__summaryRows);
}

function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// Drawer functionality
function openDrawer(repoId) {
  const drawer = document.getElementById("details-drawer");
  const overlay = document.getElementById("drawer-overlay");
  
  drawer.classList.remove("hidden");
  overlay.classList.remove("hidden");
  
  // Trigger reflow for animation
  drawer.offsetHeight;
  
  drawer.classList.add("visible");
  overlay.classList.add("visible");
  
  loadDetails(repoId);
}

function closeDrawer() {
  const drawer = document.getElementById("details-drawer");
  const overlay = document.getElementById("drawer-overlay");
  
  drawer.classList.remove("visible");
  overlay.classList.remove("visible");
  
  setTimeout(() => {
    drawer.classList.add("hidden");
    overlay.classList.add("hidden");
  }, 250);
  
  document.querySelectorAll("#summary-table tbody tr").forEach((r) => r.classList.remove("selected"));
}

async function loadDetails(repoId) {
  document.getElementById("detail-title").textContent = repoId;
  
  const summaryEl = document.getElementById("metrics-summary");
  const flagsEl = document.getElementById("metrics-flags");
  const timeEl = document.getElementById("metrics-time");
  const aiEl = document.getElementById("ai-output");
  const judgeEl = document.getElementById("judge-output");
  
  summaryEl.textContent = "Loading...";
  flagsEl.textContent = "Loading...";
  timeEl.textContent = "Loading...";
  aiEl.textContent = "Loading...";
  judgeEl.textContent = "Loading...";
  
  try {
    const [metrics, aiText, commitsData] = await Promise.all([
      fetchJSON(`/api/repo/${repoId}/metrics`),
      fetchText(`/api/repo/${repoId}/ai`),
      fetchJSON(`/api/repo/${repoId}/commits`).catch(() => ({ rows: [] })),
    ]);
    
    summaryEl.textContent = formatJSON(metrics.summary || {});
    flagsEl.textContent = formatJSON(metrics.flags || {});
    timeEl.textContent = formatJSON(metrics.time_distribution || {});
    
    // Format AI output with verdict highlighting
    if (aiText) {
      const formattedAI = formatAIOutput(aiText);
      aiEl.innerHTML = formattedAI;
    } else {
      aiEl.textContent = "No AI analysis available for this submission.";
    }
    
    const summaryRow = (window.__summaryRows || []).find(
      (r) => (r.repo_id || extractRepoName(r.repo)) === repoId
    );
    const judgeInfo = getJudgeInfoForRow(summaryRow);
    renderJudgeDetails(judgeInfo);

    renderCommits(commitsData.rows || []);
  } catch (err) {
    summaryEl.textContent = `Error: ${err.message}`;
    flagsEl.textContent = "";
    timeEl.textContent = "";
    aiEl.textContent = "";
    judgeEl.textContent = "";
  }
}

function formatAIOutput(text) {
  // Convert bullet points and highlight the verdict
  let html = escapeHtml(text);
  
  // Look for authenticity assessment line
  const verdictMatch = html.match(/(Overall authenticity assessment:.*?)$/mi);
  if (verdictMatch) {
    const verdict = verdictMatch[1];
    const isSuspicious = /suspicious|concern|flag|issue|question/i.test(verdict);
    const isAuthentic = /consistent|authentic|legitimate/i.test(verdict);
    // Suspicious takes priority over authentic keywords
    const verdictClass = isSuspicious ? 'suspicious' : (isAuthentic ? 'authentic' : 'suspicious');
    html = html.replace(verdict, `<span class="verdict ${verdictClass}">${verdict}</span>`);
  }
  
  return html;
}

function renderCommits(rows) {
  const tbody = document.querySelector("#commits-table tbody");
  const countEl = document.querySelector(".commit-count");
  tbody.innerHTML = "";
  
  countEl.textContent = `(${rows.length})`;
  
  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--muted); padding: 20px;">
          No commits data available
        </td>
      </tr>
    `;
    return;
  }
  
  rows.slice(0, 100).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="num-cell">${row.seq_index}</span></td>
      <td style="font-size: 0.7rem; color: var(--muted); white-space: nowrap;">${row.author_time_iso}</td>
      <td><span class="num-cell loc-add">+${row.insertions}</span></td>
      <td><span class="num-cell loc-del">−${row.deletions}</span></td>
      <td><span class="num-cell">${row.files_changed}</span></td>
      <td style="text-align:center">${flagChip(row.flag_bulk_commit)}</td>
      <td style="text-align:center">${flagChip(row.is_before_t0)}</td>
      <td style="text-align:center">${flagChip(row.is_after_t1)}</td>
      <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(row.subject)}">${escapeHtml(row.subject)}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Filter handlers
  ["filter-preT0", "filter-bulk", "filter-merge"].forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      renderSummaryTable(window.__summaryRows || []);
    });
  });
  document.getElementById("sort-select").addEventListener("change", () => {
    renderSummaryTable(window.__summaryRows || []);
  });
  
  // Drawer close handlers
  document.getElementById("close-drawer").addEventListener("click", closeDrawer);
  document.getElementById("drawer-overlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });
  
  // Load data
  loadSummary().catch((err) => {
    const tbody = document.querySelector("#summary-table tbody");
    tbody.innerHTML = `
      <tr>
        <td colspan="11">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <div>Failed to load data: ${err.message}</div>
          </div>
        </td>
      </tr>
    `;
  });
});
