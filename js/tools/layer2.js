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
  '00000C': 'Cisco', '000142': 'Cisco', '000143': 'Cisco', '0014BF': 'Cisco-Linksys', 'FCFBFB': 'Cisco',
  '001D0F': 'TP-Link', 'F4F5E8': 'Google', '3C5AB4': 'Google',
};

TOOLS['mac'] = {
  title: 'MAC Address Tool',
  desc: 'Normalise a MAC into every format and show its OUI/vendor, I/G & U/L bits, and EUI-64 IPv6 link-local address.',
  render() {
    return `
      <div class="tool">
        ${card('MAC Address', `
          ${field('Any format (colon, hyphen, dot, bare)', `<input type="text" id="mac-in" placeholder="00:1A:2B:3C:4D:5E" autocomplete="off">`)}
          <button class="btn btn-secondary" id="mac-rand">Random MAC</button>
        `)}
        ${card('Details', `<dl class="info-grid" id="mac-out"></dl>`, { id: 'mac-results', hidden: true })}
      </div>`;
  },
  init() {
    const eui64 = (o) => {
      const x = o.slice();
      x[0] ^= 0x02; // flip the U/L bit
      const id = [x[0], x[1], x[2], 0xff, 0xfe, x[3], x[4], x[5]].map(v => v.toString(16).padStart(2, '0')).join('');
      return id.match(/.{4}/g).join(':');
    };
    const update = () => {
      const hex = $('#mac-in').value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
      if (hex.length !== 12) { $('#mac-results').style.display = 'none'; return; }
      const b = hex.match(/.{2}/g), o = b.map(x => parseInt(x, 16));
      const first = o[0], oui = b.slice(0, 3).join('');
      const local = !!(first & 0x02), multicast = !!(first & 0x01);
      const vendor = local ? 'Locally administered (no registered vendor)' : (OUI_VENDORS[oui] || 'Unknown (look up ' + b.slice(0, 3).join(':') + ' in the IEEE OUI registry)');
      const ll = eui64(o);
      const rows = {
        'Colon': b.join(':').toLowerCase(),
        'Hyphen': b.join('-').toLowerCase(),
        'Cisco (dotted)': hex.match(/.{4}/g).join('.').toLowerCase(),
        'Bare': hex.toLowerCase(),
        'OUI (prefix)': b.slice(0, 3).join(':'),
        'Vendor': vendor,
        'First octet': first.toString(2).padStart(8, '0') + '  (bit0 I/G, bit1 U/L)',
        'Cast': multicast ? 'Multicast / group (I/G = 1)' : 'Unicast (I/G = 0)',
        'Administration': local ? 'Locally administered (U/L = 1)' : 'Universally administered (U/L = 0)',
        'EUI-64 interface ID': ll,
        'IPv6 link-local': 'fe80::' + ll,
      };
      $('#mac-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(v)}</code></dd>`).join('');
      $('#mac-results').style.display = 'block';
    };
    $('#mac-in').addEventListener('input', update);
    $('#mac-rand').addEventListener('click', () => {
      const r = crypto.getRandomValues(new Uint8Array(6));
      r[0] = (r[0] & 0xFC) | 0x02; // locally administered, unicast
      $('#mac-in').value = [...r].map(x => x.toString(16).padStart(2, '0')).join(':');
      update();
    });
    update();
  }
};
