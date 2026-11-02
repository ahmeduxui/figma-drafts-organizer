// Deep content walk (depth 12) for sparse or boilerplate-heavy files.
// Use only when the normal inspect() result is too thin to classify confidently.
// Needs helpers.js loaded first (uses window.__FIGMA_TOKEN).
// Reads the CURRENT file (window.__cur.key), walks the WHOLE document for short
// text strings, and strips template/decoration noise. Returns a word list.

(async () => {
  const r = await fetch("https://api.figma.com/v1/files/" + window.__cur.key + "?depth=12",
    { headers: { "X-Figma-Token": window.__FIGMA_TOKEN } });
  const j = JSON.parse(await r.text());
  const t = [];
  const walk = n => {
    if (n.type === 'TEXT' && n.characters) {
      const c = n.characters.trim();
      if (c && c.length < 40) t.push(c);
    }
    (n.children || []).forEach(walk);
  };
  walk(j.document);
  return [...new Set(t)].join(" ").replace(/[^A-Za-z ]/g, "").split(" ")
    .filter(w => w.length > 3 && !/preview|envato|MirNFT|Explore|creators|rankings|Auctions|Solid|Melt|Flare|Mare|Fusion|Soul|cryptopank|CryptoPunks|WonderPals|Sandbox|Azuki|Decentraland|Metroverse|Doodles|Wallet|floor|Floor|Landers|Invisible|Liquid|liquidguy/i.test(w))
    .slice(0, 55).join(" ");
})()
