// figma-drafts-organizer — session helpers
// Paste this ONCE per session via the Claude in Chrome javascript tool on the
// Figma tab (a www.figma.com page, so cookies + CSRF are available).
// Re-paste after any project-creation hard reload (it wipes window.* helpers).
//
// BEFORE PASTING, fill in the three values in CONFIG below.
// - FIGMA_TOKEN: a Figma personal access token with read-only file access
//   (Figma → Settings → Security → Personal access tokens → scope
//   "File content: Read only"). Never commit a real token to a public repo.
// - TEAM_ID: the number after /team/ in the Drafts page URL,
//   e.g. https://www.figma.com/files/team/{TEAM_ID}/drafts
// - DRAFTS_FOLDER_ID: leave empty and run window.findDraftsFolder() after
//   the helpers load (see SKILL.md → Setup).

(() => {
  const CONFIG = {
    FIGMA_TOKEN: "",        // e.g. "figd_..."  (read-only)
    TEAM_ID: "",            // e.g. "1234567890123456789"
    DRAFTS_FOLDER_ID: ""    // e.g. "123456789"
  };

  // Values already set on window (from a previous paste) win over empty CONFIG.
  const tok = window.__FIGMA_TOKEN || CONFIG.FIGMA_TOKEN;
  window.__FIGMA_TOKEN = tok;
  window.__TEAM_ID = window.__TEAM_ID || CONFIG.TEAM_ID;
  window.__DRAFTS_FOLDER_ID = window.__DRAFTS_FOLDER_ID || CONFIG.DRAFTS_FOLDER_ID;

  // Find the Drafts folder id from the requests the Drafts page already made.
  // Open https://www.figma.com/files/team/{TEAM_ID}/drafts first, then call it.
  window.findDraftsFolder = () => {
    const hit = performance.getEntriesByType("resource")
      .map(e => e.name)
      .find(u => /\/api\/folders\/\d+\/paginated_files/.test(u));
    if (!hit) return "NOT_FOUND: open the Drafts page, wait for it to load, then retry";
    window.__DRAFTS_FOLDER_ID = hit.match(/\/api\/folders\/(\d+)\//)[1];
    return "drafts=" + window.__DRAFTS_FOLDER_ID;
  };

  // Inspect a file's actual content: walk the first frames of each page and
  // collect short text strings. Result is stashed in window.__last.
  window.inspect = async (key) => {
    const r = await fetch("https://api.figma.com/v1/files/" + key + "?depth=8",
      { headers: { "X-Figma-Token": window.__FIGMA_TOKEN } });
    const j = JSON.parse(await r.text());
    const out = [];
    for (const p of (j.document.children || [])) {
      const frames = (p.children || [])
        .filter(n => n.type === 'FRAME' || n.type === 'SECTION' || n.type === 'COMPONENT');
      for (const fr of frames.slice(0, 5)) {
        const texts = [];
        const walk = n => {
          if (n.type === 'TEXT' && n.characters) {
            const c = n.characters.trim();
            if (c && c.length < 40) texts.push(c);
          }
          (n.children || []).forEach(walk);
        };
        walk(fr);
        const d = [...new Set(texts)].slice(0, 16);
        out.push("[" + p.name + "/" + fr.name + "] " + d.join(" / "));
      }
    }
    window.__last = out.join("\n");
    return "ok";
  };

  // Rename + move in ONE internal-API request. Returns "S200" on success.
  window.moveFile = async (key, folderName, newName) => {
    const folderId = window.__folders[folderName];
    if (!folderId) return "NO_FOLDER:" + folderName;
    const m = document.cookie.match(/__Host-figma\.authn-state=([^;]+)/);
    let csrf = "";
    if (m) { try { csrf = JSON.parse(decodeURIComponent(m[1])).csrfToken || ""; } catch (e) {} }
    const r = await fetch("https://www.figma.com/api/files/" + key, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-Figma-CSRF-Token": csrf },
      body: JSON.stringify({ folder_id: folderId, name: newName })
    });
    return "S" + r.status;
  };

  // Load the team's projects → window.__folders = { "<project name>": id }
  window.loadFolders = async () => {
    const r = await fetch("https://www.figma.com/api/teams/" + window.__TEAM_ID + "/folders",
      { credentials: "include" });
    const j = JSON.parse(await r.text());
    window.__folders = {};
    for (const f of (j.meta.folder_rows || [])) window.__folders[f.name] = f.id;
    return Object.keys(window.__folders).length;
  };

  // Load draft files → window.__drafts = [{key, name}, ...] (newest first)
  window.loadDrafts = async () => {
    const r = await fetch("https://www.figma.com/api/folders/" + window.__DRAFTS_FOLDER_ID +
      "/paginated_files?page_size=50&sort_column=touched_at&sort_order=desc",
      { credentials: "include" });
    const j = JSON.parse(await r.text());
    window.__drafts = (j.meta.files || []).map(f => ({ key: f.key, name: f.name }));
    return window.__drafts.length;
  };

  const missing = ["__FIGMA_TOKEN", "__TEAM_ID"].filter(k => !window[k]);
  return missing.length ? "loaded, MISSING: " + missing.join(", ") : "loaded";
})()
