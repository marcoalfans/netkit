/* ============================================================
   NetKit - IP & Subnet tools (loaded after js/core.js)
   ============================================================ */

// ----- shared IPv4 helpers -----
const ipToInt = (s) => {
  const p = s.trim().split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (const o of p) { if (!/^\d{1,3}$/.test(o)) return null; const x = +o; if (x > 255) return null; n = n * 256 + x; }
  return n >>> 0;
};
const intToIp = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
const prefixToMask = (p) => p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
const ipClass = (n) => { const o = n >>> 24; return o < 128 ? 'A' : o < 192 ? 'B' : o < 224 ? 'C' : o < 240 ? 'D (multicast)' : 'E (reserved)'; };
const ipType = (n) => {
  const o1 = n >>> 24, o2 = (n >>> 16) & 255;
  if (o1 === 10) return 'Private (RFC 1918)';
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'Private (RFC 1918)';
  if (o1 === 192 && o2 === 168) return 'Private (RFC 1918)';
  if (o1 === 127) return 'Loopback';
  if (o1 === 169 && o2 === 254) return 'Link-local';
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return 'CGNAT (RFC 6598)';
  if (o1 >= 224 && o1 <= 239) return 'Multicast';
  if (o1 >= 240) return 'Reserved';
  if (n === 0) return 'This network';
  return 'Public';
};
// parse "1.2.3.4/24" or "1.2.3.4" (=> /32). returns {ip, p} or null
const parseCidr = (s) => {
  const m = s.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/);
  let ipStr, p;
  if (m) { ipStr = m[1]; p = +m[2]; } else { ipStr = s.trim(); p = 32; }
  if (p > 32) return null;
  const ip = ipToInt(ipStr);
  if (ip === null) return null;
  return { ip, p };
};

TOOLS['cidr'] = {
  title: 'CIDR Calculator',
  desc: 'Calculate network, broadcast, mask, host range and usable hosts from a CIDR block.',
  render() {
    return `
      <div class="tool">
        ${card('CIDR Block', field('CIDR or IP / prefix', `<input type="text" id="cidr-in" placeholder="192.168.1.0/24" autocomplete="off">`))}
        ${card('Details', `<dl class="info-grid" id="cidr-out"></dl>`, { id: 'cidr-results', hidden: true })}
      </div>`;
  },
  init() {
    const update = () => {
      const r = parseCidr($('#cidr-in').value);
      if (!r) { $('#cidr-results').style.display = 'none'; return; }
      const mask = prefixToMask(r.p), net = (r.ip & mask) >>> 0, wild = (~mask) >>> 0, bc = (net | wild) >>> 0;
      const total = Math.pow(2, 32 - r.p);
      const usable = r.p >= 31 ? (r.p === 32 ? 1 : 2) : total - 2;
      const first = r.p >= 31 ? net : (net + 1) >>> 0;
      const last = r.p >= 31 ? bc : (bc - 1) >>> 0;
      const rows = {
        'Network address': intToIp(net),
        'Broadcast': intToIp(bc),
        'Netmask': intToIp(mask) + ' (/' + r.p + ')',
        'Wildcard mask': intToIp(wild),
        'CIDR notation': intToIp(net) + '/' + r.p,
        'Host range': usable > 1 ? intToIp(first) + ' - ' + intToIp(last) : intToIp(first),
        'Usable hosts': usable.toLocaleString('en-US'),
        'Total addresses': total.toLocaleString('en-US'),
        'IP class': ipClass(net),
        'Type': ipType(net),
        'Binary mask': [24, 16, 8, 0].map(sh => ((mask >>> sh) & 255).toString(2).padStart(8, '0')).join('.'),
      };
      $('#cidr-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(String(v))}</code></dd>`).join('');
      $('#cidr-results').style.display = 'block';
    };
    $('#cidr-in').addEventListener('input', update);
    update();
  }
};

TOOLS['subnet'] = {
  title: 'Subnet Calculator',
  desc: 'Split a network into equal subnets and list each range, broadcast and host count.',
  render() {
    return `
      <div class="tool">
        ${card('Network', `
          <div class="field-row">
            ${field('Network (CIDR)', `<input type="text" id="sn-net" placeholder="10.0.0.0/16" autocomplete="off">`)}
            ${field('New prefix', `<input type="number" id="sn-new" min="0" max="32" placeholder="24">`)}
          </div>
          <div class="sn-info" id="sn-info"></div>
        `)}
        ${card('', resultHead('Subnets', ghostBtn('sn-copy')) + `<pre class="not-pre mono" id="sn-out"></pre>`, { id: 'sn-results', hidden: true })}
      </div>`;
  },
  init() {
    const MAX = 1024;
    const update = () => {
      const base = parseCidr($('#sn-net').value);
      const np = parseInt($('#sn-new').value, 10);
      const info = $('#sn-info');
      if (!base || isNaN(np) || np > 32 || np < base.p) {
        info.textContent = base && !isNaN(np) && np < base.p ? 'New prefix must be larger than /' + base.p : '';
        $('#sn-results').style.display = 'none';
        return;
      }
      const count = Math.pow(2, np - base.p), size = Math.pow(2, 32 - np);
      const usable = np >= 31 ? (np === 32 ? 1 : 2) : size - 2;
      const baseNet = (base.ip & prefixToMask(base.p)) >>> 0;
      info.textContent = `${count.toLocaleString('en-US')} subnets of /${np} · ${usable.toLocaleString('en-US')} usable hosts each`;
      const shown = Math.min(count, MAX);
      const lines = ['#'.padEnd(5) + 'Subnet'.padEnd(20) + 'Range'.padEnd(34) + 'Broadcast'];
      for (let i = 0; i < shown; i++) {
        const n = (baseNet + i * size) >>> 0, b = (n + size - 1) >>> 0;
        const fh = usable > 1 ? (n + 1) >>> 0 : n, lh = usable > 1 ? (b - 1) >>> 0 : b;
        lines.push(String(i).padEnd(5) + (intToIp(n) + '/' + np).padEnd(20) + (intToIp(fh) + ' - ' + intToIp(lh)).padEnd(34) + intToIp(b));
      }
      if (count > MAX) lines.push(`... ${(count - MAX).toLocaleString('en-US')} more subnets not shown`);
      $('#sn-out').textContent = lines.join('\n');
      $('#sn-results').style.display = 'block';
    };
    $('#sn-net').addEventListener('input', update);
    $('#sn-new').addEventListener('input', update);
    wireCopy('sn-copy', () => $('#sn-out').textContent);
    update();
  }
};
