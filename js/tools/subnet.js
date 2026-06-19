/* ============================================================
   NetKit - Layer 3: IPv4 addressing & subnetting
   ============================================================ */

// ----- shared IPv4 helpers (reused by other tool files) -----
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
  if (o1 === 10 || (o1 === 172 && o2 >= 16 && o2 <= 31) || (o1 === 192 && o2 === 168)) return 'Private (RFC 1918)';
  if (o1 === 127) return 'Loopback';
  if (o1 === 169 && o2 === 254) return 'Link-local (APIPA)';
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return 'CGNAT (RFC 6598)';
  if (o1 >= 224 && o1 <= 239) return 'Multicast';
  if (o1 >= 240) return 'Reserved';
  if (n === 0) return 'This network';
  return 'Public';
};
const reverseDns = (n) => [(n & 255), (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255].join('.') + '.in-addr.arpa';
// 32-bit binary, dotted per octet, with a '|' marking the prefix (network|host) boundary
const binSplit = (n, p) => {
  let bits = ''; for (let i = 31; i >= 0; i--) bits += (n >>> i) & 1;
  let out = '';
  for (let i = 0; i < 32; i++) { if (i === p) out += '|'; else if (i > 0 && i % 8 === 0) out += '.'; out += bits[i]; }
  return out;
};
const parseCidr = (s) => {
  const m = s.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/);
  let ipStr, p;
  if (m) { ipStr = m[1]; p = +m[2]; } else { ipStr = s.trim(); p = 32; }
  if (p > 32) return null;
  const ip = ipToInt(ipStr);
  return ip === null ? null : { ip, p };
};

TOOLS['cidr'] = {
  title: 'CIDR Calculator',
  desc: 'Break a CIDR block down into network, broadcast, mask, host range, reverse DNS and a bit-level view.',
  render() {
    return `
      <div class="tool">
        ${card('CIDR Block', field('CIDR or IP / prefix', `<input type="text" id="cidr-in" placeholder="192.168.1.0/24" autocomplete="off">`))}
        ${card('Details', `<dl class="info-grid" id="cidr-out"></dl>`, { id: 'cidr-results', hidden: true })}
        ${card('Bit breakdown', resultHead('Network bits | host bits', ghostBtn('cidr-bin-copy')) + `<pre class="not-pre mono" id="cidr-bin"></pre>`, { id: 'cidr-bin-card', hidden: true })}
      </div>`;
  },
  init() {
    const update = () => {
      const r = parseCidr($('#cidr-in').value);
      if (!r) { $('#cidr-results').style.display = 'none'; $('#cidr-bin-card').style.display = 'none'; return; }
      const mask = prefixToMask(r.p), net = (r.ip & mask) >>> 0, wild = (~mask) >>> 0, bc = (net | wild) >>> 0;
      const total = Math.pow(2, 32 - r.p);
      const usable = r.p >= 31 ? (r.p === 32 ? 1 : 2) : total - 2;
      const first = r.p >= 31 ? net : (net + 1) >>> 0;
      const last = r.p >= 31 ? bc : (bc - 1) >>> 0;
      const rows = {
        'Network address': intToIp(net) + '/' + r.p,
        'Usable host range': usable > 1 ? intToIp(first) + ' - ' + intToIp(last) : intToIp(first),
        'Broadcast': intToIp(bc),
        'Netmask': intToIp(mask),
        'Wildcard mask': intToIp(wild),
        'Usable hosts': usable.toLocaleString('en-US'),
        'Total addresses': total.toLocaleString('en-US'),
        'IP class': ipClass(net),
        'Type': ipType(net),
        'Supernet': r.p > 0 ? intToIp((net & prefixToMask(r.p - 1)) >>> 0) + '/' + (r.p - 1) : 'none (/0 is the whole Internet)',
        'Contains': r.p <= 24 ? Math.pow(2, 24 - r.p).toLocaleString('en-US') + ' x /24' : Math.pow(2, 32 - r.p) + ' addresses',
        'Reverse DNS': reverseDns(net),
      };
      $('#cidr-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(String(v))}</code></dd>`).join('');
      $('#cidr-results').style.display = 'block';
      const bin = [
        ['Address  ', r.ip], ['Netmask  ', mask], ['Network  ', net], ['Broadcast', bc],
      ].map(([l, v]) => l + '  ' + binSplit(v, r.p) + '   ' + intToIp(v)).join('\n');
      $('#cidr-bin').textContent = bin;
      $('#cidr-bin-card').style.display = 'block';
    };
    $('#cidr-in').addEventListener('input', update);
    wireCopy('cidr-bin-copy', () => $('#cidr-bin').textContent);
    update();
  }
};

TOOLS['flsm'] = {
  title: 'FLSM Subnet Calculator',
  desc: 'Fixed-Length Subnet Mask: divide a network into equal-size subnets by prefix, count or hosts-per-subnet.',
  render() {
    return `
      <div class="tool">
        ${card('Network', `
          ${field('Network (CIDR)', `<input type="text" id="sn-net" placeholder="10.0.0.0/16" autocomplete="off">`)}
          <div class="field-row">
            ${field('Split by', `<select id="sn-mode">
              <option value="prefix">New prefix length</option>
              <option value="subnets">Number of subnets</option>
              <option value="hosts">Hosts per subnet</option>
            </select>`)}
            ${field('Value', `<input type="number" id="sn-val" min="1" placeholder="24">`)}
          </div>
          <div class="sn-info" id="sn-info"></div>
        `)}
        ${card('', resultHead('Subnets', ghostBtn('sn-copy')) + `<pre class="not-pre mono" id="sn-out"></pre>`, { id: 'sn-results', hidden: true })}
      </div>`;
  },
  init() {
    const MAX = 2048;
    const update = () => {
      const base = parseCidr($('#sn-net').value);
      const val = parseFloat($('#sn-val').value);
      const mode = $('#sn-mode').value;
      const info = $('#sn-info');
      if (!base || isNaN(val) || val < 1) { info.textContent = ''; $('#sn-results').style.display = 'none'; return; }
      let np;
      if (mode === 'prefix') np = Math.round(val);
      else if (mode === 'subnets') np = base.p + Math.ceil(Math.log2(val));
      else np = 32 - Math.ceil(Math.log2(val + 2)); // hosts per subnet (+net +broadcast)
      if (np < base.p) { info.textContent = `That needs a prefix shorter than the network /${base.p} — not possible.`; $('#sn-results').style.display = 'none'; return; }
      if (np > 32) { info.textContent = 'Resulting prefix would exceed /32.'; $('#sn-results').style.display = 'none'; return; }
      const count = Math.pow(2, np - base.p), size = Math.pow(2, 32 - np);
      const usable = np >= 31 ? (np === 32 ? 1 : 2) : size - 2;
      const baseNet = (base.ip & prefixToMask(base.p)) >>> 0;
      info.textContent = `/${base.p} -> /${np} (borrowed ${np - base.p} bit${np - base.p === 1 ? '' : 's'}): ${count.toLocaleString('en-US')} subnets, ${usable.toLocaleString('en-US')} usable hosts each, mask ${intToIp(prefixToMask(np))}`;
      const shown = Math.min(count, MAX);
      const lines = ['#'.padEnd(5) + 'Subnet'.padEnd(20) + 'Usable range'.padEnd(34) + 'Broadcast'];
      for (let i = 0; i < shown; i++) {
        const n = (baseNet + i * size) >>> 0, b = (n + size - 1) >>> 0;
        const fh = usable > 1 ? (n + 1) >>> 0 : n, lh = usable > 1 ? (b - 1) >>> 0 : b;
        lines.push(String(i).padEnd(5) + (intToIp(n) + '/' + np).padEnd(20) + (intToIp(fh) + ' - ' + intToIp(lh)).padEnd(34) + intToIp(b));
      }
      if (count > MAX) lines.push(`... ${(count - MAX).toLocaleString('en-US')} more subnets not shown`);
      $('#sn-out').textContent = lines.join('\n');
      $('#sn-results').style.display = 'block';
    };
    ['sn-net', 'sn-val'].forEach(id => $('#' + id).addEventListener('input', update));
    $('#sn-mode').addEventListener('change', update);
    wireCopy('sn-copy', () => $('#sn-out').textContent);
    update();
  }
};

TOOLS['vlsm'] = {
  title: 'VLSM Planner',
  desc: 'Variable-Length Subnet Mask: give each requirement the smallest subnet that fits, largest first, with no overlap.',
  render() {
    return `
      <div class="tool">
        ${card('Plan', `
          ${field('Base network (CIDR)', `<input type="text" id="vl-net" placeholder="192.168.1.0/24" autocomplete="off">`)}
          ${field('Requirements (one per line: name : hosts)', `<textarea id="vl-req" rows="6" placeholder="Sales : 50&#10;IT : 25&#10;Servers : 10&#10;WAN link : 2"></textarea>`)}
          <div class="sn-info" id="vl-info"></div>
        `)}
        ${card('', resultHead('Allocation', ghostBtn('vl-copy')) + `<pre class="not-pre mono" id="vl-out"></pre>`, { id: 'vl-results', hidden: true })}
      </div>`;
  },
  init() {
    const update = () => {
      const base = parseCidr($('#vl-net').value);
      const reqs = $('#vl-req').value.split('\n').map(l => {
        const t = l.trim(); if (!t) return null;
        const m = t.match(/^(.*?)[:,\s]\s*(\d+)\s*$/);
        if (m && m[2]) return { name: m[1].trim() || 'subnet', hosts: parseInt(m[2], 10) };
        if (/^\d+$/.test(t)) return { name: 'subnet', hosts: parseInt(t, 10) };
        return null;
      }).filter(r => r && r.hosts > 0);
      const info = $('#vl-info');
      if (!base) { info.textContent = $('#vl-net').value.trim() ? 'Enter a valid base network like 192.168.1.0/24' : ''; $('#vl-results').style.display = 'none'; return; }
      if (!reqs.length) { info.textContent = ''; $('#vl-results').style.display = 'none'; return; }
      const baseNet = (base.ip & prefixToMask(base.p)) >>> 0;
      const baseEnd = baseNet + Math.pow(2, 32 - base.p); // exclusive end
      const sorted = reqs.map((r, i) => ({ ...r, i })).sort((a, b) => b.hosts - a.hosts || a.i - b.i);
      let ptr = baseNet, ok = true, used = 0;
      const out = [];
      for (const r of sorted) {
        const hostBits = Math.max(2, Math.ceil(Math.log2(r.hosts + 2)));
        const prefix = 32 - hostBits, size = Math.pow(2, hostBits), usable = size - 2;
        if (ptr + size > baseEnd) { out.push({ ...r, overflow: true, prefix, size }); ok = false; continue; }
        out.push({ ...r, net: ptr, prefix, size, usable, bcast: ptr + size - 1, wasted: usable - r.hosts });
        ptr += size; used += size;
      }
      const rows = ['Subnet'.padEnd(14) + 'Need'.padEnd(6) + 'Network'.padEnd(20) + 'Mask'.padEnd(17) + 'Range'.padEnd(34) + 'Bcast'.padEnd(16) + 'Wasted'];
      out.sort((a, b) => a.i - b.i).forEach(r => {
        if (r.overflow) { rows.push(r.name.slice(0, 13).padEnd(14) + String(r.hosts).padEnd(6) + 'DOES NOT FIT (needs /' + r.prefix + ')'); return; }
        rows.push(
          r.name.slice(0, 13).padEnd(14) + String(r.hosts).padEnd(6) +
          (intToIp(r.net) + '/' + r.prefix).padEnd(20) + intToIp(prefixToMask(r.prefix)).padEnd(17) +
          (intToIp(r.net + 1) + ' - ' + intToIp(r.bcast - 1)).padEnd(34) + intToIp(r.bcast).padEnd(16) + r.wasted);
      });
      const total = Math.pow(2, 32 - base.p);
      info.textContent = ok
        ? `${reqs.length} subnets allocated in ${intToIp(baseNet)}/${base.p}: ${used} of ${total} addresses used, ${total - used} free (${Math.round(used / total * 100)}% utilised)`
        : `Does not fit in ${intToIp(baseNet)}/${base.p} — needs a larger block or fewer hosts.`;
      $('#vl-out').textContent = rows.join('\n');
      $('#vl-results').style.display = 'block';
    };
    $('#vl-net').addEventListener('input', update);
    $('#vl-req').addEventListener('input', update);
    wireCopy('vl-copy', () => $('#vl-out').textContent);
    update();
  }
};
