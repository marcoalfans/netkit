/* ============================================================
   NetKit - Layer 2 (Data Link) tools (loaded after js/core.js)
   ============================================================ */

// Small built-in OUI set (first 3 bytes, uppercase no separator). Not exhaustive —
// for unknowns NetKit shows the OUI prefix to look up in the IEEE registry.
const OUI_VENDORS = {
  '000C29': 'VMware', '005056': 'VMware', '000569': 'VMware',
  '080027': 'VirtualBox (Oracle)', '0A0027': 'VirtualBox (Oracle)',
  '00155D': 'Microsoft (Hyper-V)', '525400': 'QEMU / KVM',
  'B827EB': 'Raspberry Pi', 'DCA632': 'Raspberry Pi', 'E45F01': 'Raspberry Pi', '2CCF67': 'Raspberry Pi',
  '00000C': 'Cisco', '000142': 'Cisco', '000143': 'Cisco', '0014BF': 'Cisco-Linksys',
  '001D0F': 'TP-Link', 'F4F5E8': 'Google', '3C5AB4': 'Google', 'FCFBFB': 'Cisco',
};

TOOLS['mac'] = {
  title: 'MAC Address Tool',
  desc: 'Normalise a MAC address into every format and reveal its OUI, vendor and unicast/local bits.',
  render() {
    return `
      <div class="tool">
        ${card('MAC Address', field('Any format (colon, hyphen, dot, bare)', `<input type="text" id="mac-in" placeholder="00:1A:2B:3C:4D:5E" autocomplete="off">`))}
        ${card('Details', `<dl class="info-grid" id="mac-out"></dl>`, { id: 'mac-results', hidden: true })}
      </div>`;
  },
  init() {
    const update = () => {
      const hex = $('#mac-in').value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
      if (hex.length !== 12) { $('#mac-results').style.display = 'none'; return; }
      const b = hex.match(/.{2}/g); // 6 octets
      const lower = b.join(':').toLowerCase();
      const first = parseInt(b[0], 16);
      const oui = b.slice(0, 3).join('');
      const local = !!(first & 0x02);
      const vendor = local ? 'Locally administered (no registered vendor)' : (OUI_VENDORS[oui] || 'Unknown (look up ' + b.slice(0, 3).join(':') + ' in the IEEE OUI registry)');
      const rows = {
        'Colon': lower,
        'Hyphen': b.join('-').toLowerCase(),
        'Cisco (dotted)': (hex.match(/.{4}/g).join('.')).toLowerCase(),
        'Bare': hex.toLowerCase(),
        'Uppercase': b.join(':'),
        'OUI (prefix)': b.slice(0, 3).join(':'),
        'Vendor': vendor,
        'Cast': (first & 0x01) ? 'Multicast / group (I/G = 1)' : 'Unicast (I/G = 0)',
        'Administration': local ? 'Locally administered (U/L = 1)' : 'Universally administered (U/L = 0)',
      };
      $('#mac-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(v)}</code></dd>`).join('');
      $('#mac-results').style.display = 'block';
    };
    $('#mac-in').addEventListener('input', update);
    update();
  }
};
