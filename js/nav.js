/* ============================================================
   NetKit - Navigation: per-tool EXAMPLES + loadTool (load LAST)
   Loaded after js/core.js (uses $, el, TOOLS, helpers).
   ============================================================ */

// ============================================================
// NAVIGATION
// ============================================================
// ============================================================
// Per-tool EXAMPLES — feature-specific sample inputs (not generic defaults)
// ============================================================
// accepts a bare id ("cidr-in") or a full CSS selector
const exFill = (idOrSel, val) => {
  const el = $(/^[#.\[]/.test(idOrSel) ? idOrSel : '#' + idOrSel);
  if (!el) return;
  el.value = val;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const exClick = (id) => { const el = $('#' + id); if (el) el.click(); };

const EXAMPLES = {
  'bandwidth': () => { exFill('bw-size', '5'); exFill('bw-sunit', 'GB'); exFill('bw-speed', '100'); exFill('bw-spunit', 'Mbps'); },
  'mac': () => { exFill('mac-in', '00:0c:29:3a:4b:5c'); },
  'cidr': () => { exFill('cidr-in', '192.168.1.0/24'); },
  'subnet': () => { exFill('sn-net', '10.0.0.0/16'); exFill('sn-new', '24'); },
  'ip-convert': () => { exFill('ipc-in', '3232235521'); },
  'ua-parser': () => { exClick('ua-mine'); },
};

// Renders a tool into the main pane. Single source of truth for nav state;
// invoked only by the hash router in index.html (#/<tool>).
const loadTool = (key) => {
  const tool = TOOLS[key];
  if (!tool) return;
  $('#currentToolTitle').textContent = tool.title;
  $('#currentToolDesc').textContent = tool.desc;
  $('#content').innerHTML = tool.render();
  if (tool.init) tool.init();
  if (window.translateUI) window.translateUI();
  const exBtn = $('#rk-example-btn');
  if (exBtn) {
    const ex = EXAMPLES[key];
    exBtn.style.display = ex ? '' : 'none';
    exBtn.onclick = ex || null;
  }
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tool === key));
};
window.loadTool = loadTool;
