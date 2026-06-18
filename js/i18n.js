/* ============================================================
   NetKit - i18n (EN / ID)
   Translates feature text only (tool descriptions, field labels,
   placeholders, tooltips and explanatory UI). English is the source;
   a DOM pass swaps known phrases to Indonesian when lang = id, so any
   string not in the dictionary (payloads, code, vectors) is left as is.
   ============================================================ */
(function () {
  const DICT = {
    // ---------- Tool descriptions ----------
    'Calculate network, broadcast, mask, host range and usable hosts from a CIDR block.': 'Hitung alamat network, broadcast, mask, rentang host, dan jumlah host usable dari sebuah blok CIDR.',
    'Split a network into equal subnets and list each range, broadcast and host count.': 'Bagi sebuah network menjadi subnet sama besar dan tampilkan rentang, broadcast, serta jumlah host tiap subnet.',
    'Convert an IPv4 address between dotted, decimal, hex, octal, binary and IPv6 forms.': 'Konversi alamat IPv4 antara dotted, desimal, hex, oktal, biner, dan bentuk IPv6.',
    'Parse a User-Agent string into browser, engine, operating system and device.': 'Urai string User-Agent menjadi browser, engine, sistem operasi, dan perangkat.',

    // ---------- Common ----------
    'Copy': 'Salin',
    'Details': 'Detail',
    'Network': 'Network',

    // ---------- CIDR Calculator ----------
    'CIDR Block': 'Blok CIDR',
    'CIDR or IP / prefix': 'CIDR atau IP / prefix',
    'Network address': 'Alamat network',
    'Netmask': 'Netmask',
    'Wildcard mask': 'Wildcard mask',
    'CIDR notation': 'Notasi CIDR',
    'Host range': 'Rentang host',
    'Usable hosts': 'Host usable',
    'Total addresses': 'Total alamat',
    'IP class': 'Kelas IP',
    'Type': 'Tipe',
    'Binary mask': 'Mask biner',

    // ---------- Subnet Calculator ----------
    'Network (CIDR)': 'Network (CIDR)',
    'New prefix': 'Prefix baru',
    'Subnets': 'Subnet',

    // ---------- IP Converter ----------
    'IPv4, integer, hex (0x...) or 32-bit binary': 'IPv4, integer, hex (0x...), atau biner 32-bit',
    'Conversions': 'Konversi',
    'Dotted decimal': 'Desimal bertitik',
    'Decimal (integer)': 'Desimal (integer)',
    'Hexadecimal': 'Heksadesimal',
    'Hex (dotted)': 'Hex (bertitik)',
    'Octal': 'Oktal',
    'Binary': 'Biner',

    // ---------- User-Agent Parser ----------
    'User-Agent string': 'String User-Agent',
    'Use my browser': 'Pakai browser saya',
    'Parsed': 'Hasil Urai',
    'Browser': 'Browser',
    'Engine': 'Engine',
    'Operating system': 'Sistem operasi',
    'Device type': 'Jenis perangkat',

    // ---------- Layer 1: Bandwidth ----------
    'Work out how long a transfer takes from data size and link speed, and convert between bit/s and byte/s.': 'Hitung lama transfer dari ukuran data dan kecepatan link, serta konversi antara bit/s dan byte/s.',
    'Transfer': 'Transfer',
    'Data size': 'Ukuran data',
    'Unit': 'Satuan',
    'Link speed': 'Kecepatan link',
    'Result': 'Hasil',
    'Transfer time': 'Waktu transfer',
    'Link speed (bit/s)': 'Kecepatan link (bit/s)',
    'Link speed (byte/s)': 'Kecepatan link (byte/s)',
    'Seconds': 'Detik',

    // ---------- Layer 2: MAC ----------
    'Normalise a MAC address into every format and reveal its OUI, vendor and unicast/local bits.': 'Normalkan alamat MAC ke semua format dan tampilkan OUI, vendor, serta bit unicast/lokalnya.',
    'MAC Address': 'Alamat MAC',
    'Any format (colon, hyphen, dot, bare)': 'Format apa saja (titik dua, strip, titik, polos)',
    'Colon': 'Titik dua',
    'Hyphen': 'Strip',
    'Cisco (dotted)': 'Cisco (titik)',
    'Bare': 'Polos',
    'Uppercase': 'Huruf besar',
    'OUI (prefix)': 'OUI (prefiks)',
    'Vendor': 'Vendor',
    'Cast': 'Cast',
    'Administration': 'Administrasi',
  };

  const getLang = () => localStorage.getItem('lang') || 'en';
  const setLang = (l) => { localStorage.setItem('lang', l); document.documentElement.setAttribute('data-lang', l); };

  // never translate raw output/code panes — their text is user/decoded data that
  // could coincidentally equal a dictionary key and get corrupted.
  const SKIP = '.result-box, pre, code, [data-noi18n]';
  const inSkip = (node) => { const e = node.nodeType === 1 ? node : node.parentElement; return !!(e && e.closest && e.closest(SKIP)); };

  // swap a trimmed phrase while preserving surrounding whitespace
  const trText = (s) => { const k = s.trim(); if (!k) return s; const v = DICT[k]; return v === undefined ? s : s.replace(k, v); };
  const ATTRS = ['placeholder', 'data-tip', 'title'];
  const trEl = (e) => ATTRS.forEach(a => { if (e.hasAttribute && e.hasAttribute(a)) { const val = e.getAttribute(a), k = val.trim(); if (DICT[k] !== undefined) e.setAttribute(a, val.replace(k, DICT[k])); } });

  const translateNode = (root) => {
    if (getLang() !== 'id' || !root) return;
    // assign only when the value actually changes — keeps the characterData
    // observer loop-free (a translated value is never a dictionary key).
    if (root.nodeType === 3) { if (!inSkip(root)) setText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.closest(SKIP)) return;
    trEl(root);
    root.querySelectorAll('[placeholder],[data-tip],[title]').forEach(e => { if (!e.closest(SKIP)) trEl(e); });
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: t => (t.parentElement && t.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const arr = []; let n; while ((n = w.nextNode())) arr.push(n);
    arr.forEach(setText);
  };
  const setText = (t) => { const nv = trText(t.nodeValue); if (nv !== t.nodeValue) t.nodeValue = nv; };

  // re-translate the active tool's pane + description (called by loadTool)
  const translateUI = () => {
    document.documentElement.setAttribute('data-lang', getLang());
    if (getLang() !== 'id') return;
    translateNode(document.getElementById('currentToolDesc'));
    translateNode(document.getElementById('content'));
  };

  // dynamically inserted results (Generate, Lookup, ...) are translated on the fly
  let observer = null;
  const ensureObserver = () => {
    if (observer) return;
    const content = document.getElementById('content');
    if (!content) return;
    observer = new MutationObserver(muts => {
      if (getLang() !== 'id') return;
      for (const m of muts) {
        if (m.type === 'characterData') translateNode(m.target);
        else m.addedNodes.forEach(translateNode);
      }
    });
    observer.observe(content, { childList: true, subtree: true, characterData: true });
  };

  window.getLang = getLang;
  window.setLang = setLang;
  window.translateUI = translateUI;

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.setAttribute('data-lang', getLang());
    ensureObserver();
  });
})();
