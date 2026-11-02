---
name: figma-drafts-organizer
description: >-
  Autonomously organizes ALL draft files in a Figma team by inspecting each
  file's ACTUAL content (not its old name), giving it a descriptive English
  name, and moving it into the matching numbered category project — using
  Figma's internal API (no mouse automation). Creates a new numbered category
  project when none matches. Use this skill whenever the user wants to organize,
  clean up, sort, classify, rename, or move Figma draft files, or says things
  like "organize my figma drafts", "نظّم ملفات الدرافت", "صنف وانقل ملفات فيجما",
  "رتّب الدرافت", "clean up my figma drafts", "sort my figma files by category",
  even if they don't mention every step explicitly. The default mode is fully
  autonomous: process every draft one at a time without asking permission
  between files.
---

# Figma Drafts Organizer (Autonomous, Internal-API)

This skill captures a proven, reliable way to empty a Figma team's **Drafts**
folder by classifying every file and filing it into the right numbered category
project. It does the whole thing through Figma's **internal API** via the
Claude in Chrome `javascript_tool` — no clicking file cards, no Move
dialog, no rename-field fiddling. That mouse-driven approach was slow and brittle;
the internal API does move + rename in one request and never gets stuck.

The core idea that makes results good: **the file's content is the source of
truth, never its old name.** Old draft names are routinely wrong, generic, or
copied. So for each file we read the real text inside its frames, decide a name
and a category from that, then rename + move.

## Operating mode

Default is **fully autonomous**: work through the Drafts folder one file at a
time, in order, renaming and moving each file immediately without pausing for
approval between files. Report a short result per file. Only stop to ask the
user if something is genuinely ambiguous in a way you cannot resolve from
content (rare) or if an API call fails repeatedly.

If the user explicitly asks for a preview/approval pass instead, show a
comparison table (current name → suggested name + category) and wait — but that
is the exception, not the default.

## The five steps (per file — reuse these, don't invent new ones)

For **each** draft file, do exactly these five things, in this order:

1. **Capture the file key** — from the drafts list (index 0 of the re-fetched list).
2. **Inspect actual content** — read the real text in the frames via REST API. Do NOT trust the old name.
3. **Determine a new name + a category** — both derived from the content.
   Name pattern: `<Subject> - <Key features> Dashboard` (English, regardless of the design's language).
4. **Resolve the destination project** — find the matching numbered category project; if none exists, create one (next number in sequence).
5. **Rename + move** — one internal-API `PUT` that does both. Expect HTTP 200.

Then re-fetch the drafts list and repeat from step 1 until the Drafts folder is
empty. Re-fetch every iteration because the list reorders as files leave it, so
always take **index 0**.

---

## Setup (once per session)

1. Make sure a Chrome tab is open on the team's Drafts page, e.g.
   `https://www.figma.com/files/team/{TEAM_ID}/drafts`, and you have its `tabId`.
   The user must be signed in to Figma in that Chrome profile.

2. Collect the user's values. Ask once if they are not already known:
   - `FIGMA_TOKEN` — a Figma personal access token with **read-only** file
     access (Figma → Settings → Security → Personal access tokens → scope
     "File content: Read only"). Used only to read file content.
   - `TEAM_ID` — the number after `/team/` in the Drafts page URL.

   Put them in the `CONFIG` block of `scripts/helpers.js` (or set
   `window.__FIGMA_TOKEN` and `window.__TEAM_ID` before pasting).
   Never write the token into a file that will be shared or committed.

3. Paste the helper block once (see `scripts/helpers.js`). It defines
   `findDraftsFolder`, `inspect`, `moveFile`, `loadFolders`, `loadDrafts` on
   `window`. Run all JS through the Claude in Chrome `javascript_tool` on the
   Figma tab.

4. Find the Drafts folder id (the Drafts page must have finished loading):
   ```javascript
   window.findDraftsFolder()   // → "drafts=<id>"
   ```
   If it returns `NOT_FOUND`, reload the Drafts page, wait, re-paste the
   helpers and try again.

5. Load the category projects so renames/moves can find them:
   ```javascript
   window.loadFolders()   // populates window.__folders = { "<name>": id, ... }
   ```

> **The helpers survive normal in-app (SPA) navigation, but a project-creation
> page does a hard reload and WIPES them.** After creating a new project,
> re-paste the helper block and re-run `loadFolders()` before continuing.
> Keep the token, team id and drafts folder id in your notes so you can
> restore them after the reload.

### First run on a team with no category projects

If the team has no numbered projects yet, the first files will each create a
category (`01 - ...`, `02 - ...`). That is expected. `references/categories.md`
holds a starter list of categories that works well for UI/dashboard work; use
it as a naming guide, not as a list that must already exist.

The live category list is `window.__folders` after `loadFolders()`.
`references/categories.md` is a starter list and naming guide; read it to keep
new categories consistent and to find the next free number.

---

## Step 1–2 — Grab the next file and inspect its content

Fetch the drafts list, take index 0, and fire content inspection:

```javascript
window.loadDrafts().then(n=>{
  window.__last="CLEARED"; window.__ir="";
  const d=window.__drafts[0]; window.__cur=d; window.__cn=d?d.name:null;
  if(d){ window.inspect(d.key).then(r=>window.__ir=r).catch(e=>window.__ir="ERR:"+e); }
  return "n="+n+(d?(" first="+String(d.name).replace(/[^A-Za-z0-9 ]/g,"")+" key="+d.key):" EMPTY");
})
```

`n=0 EMPTY` means the Drafts folder is empty — you're done.

`window.inspect` walks each page's first few frames and collects short text
strings. After firing it, wait ~8 seconds, then read the cleaned word list
(this filter drops template boilerplate — see the ignore list below):

```javascript
new Promise(res=>setTimeout(()=>res(
  [...new Set((window.__last.match(/[A-Za-z]{4,}/g)||[]))]
    .filter(w=>!/http|www|figma|preview|envato|MirNFT|Explore|creators|rankings|Auctions|Solid|Melt|Flare|Mare|Fusion|Soul/i.test(w))
    .slice(0,40).join(" ")
), 8000))
```

Use the JS `setTimeout` promise above for the delay rather than a separate
wait tool — it keeps everything inside the browser tab.

**If the result is sparse or dominated by boilerplate**, escalate to a deeper
full-document walk (depth 12) — see `scripts/deep_walk.js`. If content is still
too thin to classify, fall back to the file's old name as a last resort.

### Boilerplate to IGNORE when classifying

Many drafts are bought templates that share decorative thumbnails. Classify by
the **main named dashboard frame**, not these:
- NFT preview thumbnails (MirNFT / preview envato / Explore / Auctions / CryptoPunks / WonderPals / Azuki / Doodles / Decentraland / Sandbox / etc.)
- Music-preview thumbnails, FastEat food previews
- The generic medical template sidebar (Message / Test / Payment / Appointment / Settings / Help / Medicine / Order / "Welcome Alexa June") when it shows up inside a non-medical file

---

## Step 3 — Decide name + category from content

Build the name as `<Subject> - <Key features> Dashboard`, in English. Examples
from real runs:
- Crypto wallet + exchange + analytics → `Crypto Trading Platform - Wallet & Exchange Dashboard` → category `07 - Crypto`
- Online courses, students, lecturer, analytics → `Online Courses - Students & Performance Dashboard` → `05 - LMS`
- Chat app with messages/groups → `Chat App - Messages & Groups Dashboard` → `36 - Chat & Messaging`
- Calorie/training tracker → `Health Tracker - Calories & Training Dashboard` → `14 - Medical & Health`

Pick the category by matching content signals to the numbered project list in
`references/categories.md`.

---

## Step 4 — Resolve (or create) the destination project

Look up the category name in `window.__folders`. Most folder keys carry a
trailing ` Dashboard` (e.g. `02 - Finance & Insurance Dashboard`); a few do not
(`04 - UI Components`, `37 - Agency & Portfolio Website`,
`47 - Pitch Deck & Presentation`, `48 - UX Case Study`). Use the exact key.

**If no matching category project exists, create one** (this is expected and
authorized — don't stop to ask). The internal API can't create projects, so use
the Figma UI:

1. Navigate to `https://www.figma.com/files/team/{TEAM_ID}/all-projects`.
2. Click **+ Project** (top-right). Coordinates vary by screen — take a
   screenshot or use `find` to locate each control.
3. Wait, click the Name field, type the new numbered name
   (next free number from `references/categories.md`, same style as the rest,
   e.g. `49 - Crowdfunding & Fundraising Dashboard`).
4. Click **Continue**.
5. On Step 2 "Add people", click **Create project** **WITHOUT
   adding anyone** — never change sharing/permissions.
6. The page hard-reloads into the new project → **re-paste helpers** and re-run
   `loadFolders()`.

Then proceed to the move.

---

## Step 5 — Rename + move in one call

```javascript
window.moveFile(window.__cur.key, "<CATEGORY FOLDER KEY>", "<NEW NAME>").then(r=>"mv="+r)
```

`mv=S200` means success (renamed and moved together). Anything else: re-read the
cookie/CSRF, confirm the folder key exists in `window.__folders`, and retry.

Loop back to Step 1.

---

## Hard rules (these protect the user — follow them)

- **Content is the reference, never the old name.** Always inspect before naming.
- **Autonomous by default** — no permission prompts between files. Just report results.
- **English names**, pattern `<Subject> - <Key features> Dashboard`.
- **Create a category when missing**, using the next number in sequence; never reuse a number.
- **Never delete anything** — no trashing files, no emptying drafts by deletion. Files only move.
- **Never change sharing or permissions** — when creating a project, click "Create project" without adding people.
- **One file at a time**, always re-fetch and take index 0 (the list reorders).
- **Re-paste helpers after any project-creation hard reload.**
- Use Chrome JS for all Figma API calls — never bash/WebFetch (blocked by proxy).

## What does NOT work (don't waste time)

- `PUT /v1/files/{key}` (public REST) → 404. Use the **internal** `PUT /api/files/{key}` (in `moveFile`).
- Public REST has no Drafts-listing endpoint → use internal `/api/folders/{id}/paginated_files` (in `loadDrafts`).
- Creating projects via API → not supported. Use the UI flow above.
- Separate wait tools → unreliable here; use a JS `setTimeout` promise.
- Reading a 22-char file key as one raw string can be blocked as base64 — the helpers already return keys safely.

## Reference files

- `references/categories.md` — a starter numbered category list + which keys lack the ` Dashboard` suffix, and how to find the next free number.
- `scripts/helpers.js` — the helper block to paste once per session (findDraftsFolder / inspect / moveFile / loadFolders / loadDrafts), with the CONFIG block and CSRF handling.
- `scripts/deep_walk.js` — depth-12 full-document text walk for sparse/boilerplate-heavy files.

## A note on the internal API

The rename + move and the Drafts listing use Figma's **internal web API** (the
same endpoints the Figma web app calls), not the documented public REST API.
It is undocumented and can change without notice. If a call that used to work
starts failing, the endpoint has likely changed. Use this skill at your own
discretion and in line with Figma's terms.
