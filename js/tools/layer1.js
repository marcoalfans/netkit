/* ============================================================
   NetKit - Layer 1 (Physical) tools (loaded after js/core.js)
   ============================================================ */

TOOLS['bandwidth'] = {
  title: 'Bandwidth & Transfer Time',
  desc: 'Work out transfer time from data size and link speed, factor in protocol overhead, and convert bit/s to byte/s.',
  render() {
    const sizeUnits = ['B', 'KB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB', 'TiB'];
    const speedUnits = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];
    const opts = (arr, sel) => arr.map(u => `<option${u === sel ? ' selected' : ''}>${u}</option>`).join('');
    return `
      <div class="tool">
        ${card('Transfer', `
          <div class="field-row">
            ${field('Data size', `<input type="number" id="bw-size" value="1" min="0" step="any">`)}
            ${field('Unit', `<select id="bw-sunit">${opts(sizeUnits, 'GB')}</select>`)}
          </div>
          <div class="field-row">
            ${field('Link speed', `<input type="number" id="bw-speed" value="100" min="0" step="any">`)}
            ${field('Unit', `<select id="bw-spunit">${opts(speedUnits, 'Mbps')}</select>`)}
          </div>
          ${field('Protocol overhead %', `<input type="number" id="bw-ovh" value="0" min="0" max="95" step="any" placeholder="e.g. 8 for TCP/IP over Ethernet">`)}
        `)}
        ${card('Result', `<dl class="info-grid" id="bw-out"></dl>`, { id: 'bw-results', hidden: true })}
      </div>`;
  },
  init() {
    const SZ = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 };
    const SP = { bps: 1, Kbps: 1e3, Mbps: 1e6, Gbps: 1e9, Tbps: 1e12 };
    const human = (s) => {
      if (!isFinite(s)) return '∞';
      if (s < 1) return (s * 1000).toFixed(s < 0.001 ? 3 : 0) + ' ms';
      const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = Math.round(s % 60);
      return [d && d + 'd', h && h + 'h', m && m + 'm', (sec || (!d && !h && !m)) && sec + 's'].filter(Boolean).join(' ');
    };
    const fmtRate = (bytesPerSec) => {
      const u = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']; let i = 0, b = bytesPerSec; while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; }
      return b.toFixed(i ? 2 : 0) + ' ' + u[i];
    };
    const update = () => {
      const size = parseFloat($('#bw-size').value), speed = parseFloat($('#bw-speed').value);
      const ovh = Math.min(95, Math.max(0, parseFloat($('#bw-ovh').value) || 0));
      if (isNaN(size) || isNaN(speed) || speed <= 0) { $('#bw-results').style.display = 'none'; return; }
      const bytes = size * SZ[$('#bw-sunit').value], bits = bytes * 8;
      const bps = speed * SP[$('#bw-spunit').value];
      const effBps = bps * (1 - ovh / 100);
      const rows = {
        'Ideal transfer time': human(bits / bps),
        'Effective time (with overhead)': ovh ? human(bits / effBps) : human(bits / bps),
        'Effective throughput': fmtRate(effBps / 8),
        'Data size': bits.toLocaleString('en-US') + ' bits / ' + bytes.toLocaleString('en-US') + ' bytes',
        'Link speed': bps.toLocaleString('en-US') + ' bit/s  =  ' + fmtRate(bps / 8),
      };
      $('#bw-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(v)}</code></dd>`).join('');
      $('#bw-results').style.display = 'block';
    };
    ['bw-size', 'bw-sunit', 'bw-speed', 'bw-spunit', 'bw-ovh'].forEach(id => { $('#' + id).addEventListener('input', update); $('#' + id).addEventListener('change', update); });
    update();
  }
};
