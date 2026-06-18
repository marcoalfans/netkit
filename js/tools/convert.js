/* ============================================================
   NetKit - Convert & Parse tools (loaded after js/tools/subnet.js,
   reuses ipToInt / intToIp from there)
   ============================================================ */

TOOLS['ip-convert'] = {
  title: 'IP Converter',
  desc: 'Convert an IPv4 address between dotted, decimal, hex, octal, binary and IPv6 forms.',
  render() {
    return `
      <div class="tool">
        ${card('Input', field('IPv4, integer, hex (0x...) or 32-bit binary', `<input type="text" id="ipc-in" placeholder="192.168.0.1" autocomplete="off">`))}
        ${card('Conversions', `<dl class="info-grid" id="ipc-out"></dl>`, { id: 'ipc-results', hidden: true })}
      </div>`;
  },
  init() {
    const parseAny = (s) => {
      s = s.trim();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return ipToInt(s);
      if (/^0x[0-9a-f]+$/i.test(s)) { const n = parseInt(s, 16); return n <= 0xffffffff ? n >>> 0 : null; }
      if (/^[01]{32}$/.test(s)) return parseInt(s, 2) >>> 0;
      if (/^\d+$/.test(s)) { const n = Number(s); return n <= 0xffffffff ? n >>> 0 : null; }
      return null;
    };
    const update = () => {
      const n = parseAny($('#ipc-in').value);
      if (n === null || n === undefined) { $('#ipc-results').style.display = 'none'; return; }
      const u = n >>> 0;
      const rows = {
        'Dotted decimal': intToIp(u),
        'Decimal (integer)': String(u),
        'Hexadecimal': '0x' + u.toString(16).toUpperCase().padStart(8, '0'),
        'Hex (dotted)': [24, 16, 8, 0].map(sh => ((u >>> sh) & 255).toString(16).toUpperCase().padStart(2, '0')).join('.'),
        'Octal': '0' + u.toString(8),
        'Binary': [24, 16, 8, 0].map(sh => ((u >>> sh) & 255).toString(2).padStart(8, '0')).join('.'),
        'IPv6 (mapped)': '::ffff:' + intToIp(u),
        'IPv6 (hex)': '::ffff:' + ((u >>> 16) & 0xffff).toString(16) + ':' + (u & 0xffff).toString(16),
      };
      $('#ipc-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(v)}</code></dd>`).join('');
      $('#ipc-results').style.display = 'block';
    };
    $('#ipc-in').addEventListener('input', update);
    update();
  }
};

TOOLS['ua-parser'] = {
  title: 'User-Agent Parser',
  desc: 'Parse a User-Agent string into browser, engine, operating system and device.',
  render() {
    return `
      <div class="tool">
        ${card('User-Agent', `
          ${field('User-Agent string', `<textarea id="ua-in" rows="3" placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"></textarea>`)}
          <button class="btn btn-secondary" id="ua-mine">Use my browser</button>
        `)}
        ${card('Parsed', `<dl class="info-grid" id="ua-out"></dl>`, { id: 'ua-results', hidden: true })}
      </div>`;
  },
  init() {
    const m = (re, s) => { const x = s.match(re); return x ? (x[1] || '').replace(/_/g, '.') : ''; };
    const parse = (ua) => {
      let browser = 'Unknown', version = '';
      if (/Edg(?:e|A|iOS)?\//.test(ua)) { browser = 'Edge'; version = m(/Edg(?:e|A|iOS)?\/([\d.]+)/, ua); }
      else if (/OPR\/|Opera/.test(ua)) { browser = 'Opera'; version = m(/(?:OPR|Opera)\/([\d.]+)/, ua); }
      else if (/SamsungBrowser\//.test(ua)) { browser = 'Samsung Internet'; version = m(/SamsungBrowser\/([\d.]+)/, ua); }
      else if (/Firefox\/|FxiOS\//.test(ua)) { browser = 'Firefox'; version = m(/(?:Firefox|FxiOS)\/([\d.]+)/, ua); }
      else if (/Chrome\/|CriOS\//.test(ua)) { browser = 'Chrome'; version = m(/(?:Chrome|CriOS)\/([\d.]+)/, ua); }
      else if (/Safari\//.test(ua) && /Version\//.test(ua)) { browser = 'Safari'; version = m(/Version\/([\d.]+)/, ua); }
      else if (/MSIE |Trident\//.test(ua)) { browser = 'Internet Explorer'; version = m(/(?:MSIE |rv:)([\d.]+)/, ua); }
      else if (/curl\//.test(ua)) { browser = 'curl'; version = m(/curl\/([\d.]+)/, ua); }
      else if (/wget/i.test(ua)) { browser = 'Wget'; }
      else if (/bot|crawl|spider|slurp/i.test(ua)) { browser = 'Bot / Crawler'; }

      let engine = 'Unknown';
      if (/Gecko\//.test(ua) && /Firefox/.test(ua)) engine = 'Gecko';
      else if (/AppleWebKit\//.test(ua)) engine = /Chrome|CriOS|Edg|OPR/.test(ua) ? 'Blink' : 'WebKit';
      else if (/Trident\//.test(ua)) engine = 'Trident';
      const engVer = m(/AppleWebKit\/([\d.]+)/, ua) || m(/Gecko\/([\d.]+)/, ua);

      let os = 'Unknown';
      if (/Windows NT 10/.test(ua)) os = 'Windows 10 / 11';
      else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1';
      else if (/Windows NT 6\.1/.test(ua)) os = 'Windows 7';
      else if (/Windows NT/.test(ua)) os = 'Windows';
      else if (/Android/.test(ua)) os = 'Android ' + m(/Android ([\d.]+)/, ua);
      else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS ' + m(/OS ([\d_]+)/, ua);
      else if (/Mac OS X/.test(ua)) os = 'macOS ' + m(/Mac OS X ([\d_]+)/, ua);
      else if (/CrOS/.test(ua)) os = 'ChromeOS';
      else if (/Linux/.test(ua)) os = 'Linux';

      const device = /Mobile|iPhone|iPod|Android.*Mobile/.test(ua) ? 'Mobile'
        : /iPad|Tablet|Android(?!.*Mobile)/.test(ua) ? 'Tablet'
        : /bot|crawl|spider/i.test(ua) ? 'Bot' : 'Desktop';

      return {
        'Browser': browser + (version ? ' ' + version : ''),
        'Engine': engine + (engVer ? ' ' + engVer : ''),
        'Operating system': os.trim(),
        'Device type': device,
      };
    };
    const update = () => {
      const ua = $('#ua-in').value.trim();
      if (!ua) { $('#ua-results').style.display = 'none'; return; }
      const r = parse(ua);
      $('#ua-out').innerHTML = Object.entries(r).map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v || '-')}</dd>`).join('');
      $('#ua-results').style.display = 'block';
    };
    $('#ua-in').addEventListener('input', update);
    $('#ua-mine').addEventListener('click', () => { $('#ua-in').value = navigator.userAgent; update(); });
    update();
  }
};
