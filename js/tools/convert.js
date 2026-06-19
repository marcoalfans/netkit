/* ============================================================
   NetKit - Layer 3 IP converter + Toolbox User-Agent parser
   (loaded after js/tools/subnet.js, reuses ipToInt / intToIp)
   ============================================================ */

// ----- IPv6 helpers -----
const parseIpv6 = (s) => {
  s = s.trim().toLowerCase();
  if (!s.includes(':')) return null;
  if ((s.match(/::/g) || []).length > 1) return null;
  let core = s;
  const v4m = core.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4m) { const v4 = ipToInt(v4m[1]); if (v4 === null) return null; core = core.slice(0, v4m.index) + ((v4 >>> 16) & 0xffff).toString(16) + ':' + (v4 & 0xffff).toString(16); }
  let groups;
  if (core.includes('::')) {
    const [h, t] = core.split('::');
    const head = h ? h.split(':') : [], tail = t ? t.split(':') : [];
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    groups = [...head, ...Array(fill).fill('0'), ...tail];
  } else { groups = core.split(':'); }
  if (groups.length !== 8) return null;
  const g = groups.map(x => /^[0-9a-f]{1,4}$/.test(x) ? parseInt(x, 16) : NaN);
  return g.some(Number.isNaN) ? null : g;
};
const v6Full = (g) => g.map(x => x.toString(16).padStart(4, '0')).join(':');
const v6Compress = (g) => {
  const h = g.map(x => x.toString(16));
  let best = -1, bestLen = 1, i = 0;
  while (i < 8) { if (g[i] === 0) { let j = i; while (j < 8 && g[j] === 0) j++; if (j - i > bestLen) { bestLen = j - i; best = i; } i = j; } else i++; }
  if (best < 0) return h.join(':');
  return (h.slice(0, best).join(':')) + '::' + (h.slice(best + bestLen).join(':'));
};
const v6Reverse = (g) => v6Full(g).replace(/:/g, '').split('').reverse().join('.') + '.ip6.arpa';
const v4Reverse = (n) => [(n & 255), (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255].join('.') + '.in-addr.arpa';

TOOLS['ip-convert'] = {
  title: 'IP Converter',
  desc: 'Convert IPv4 (dotted, decimal, hex, octal, binary) and IPv6 (expand, compress, mapped) with reverse DNS.',
  render() {
    return `
      <div class="tool">
        ${card('Input', field('IPv4, IPv6, integer, hex (0x...) or 32-bit binary', `<input type="text" id="ipc-in" placeholder="192.168.0.1  or  2001:db8::1" autocomplete="off">`))}
        ${card('Conversions', `<dl class="info-grid" id="ipc-out"></dl>`, { id: 'ipc-results', hidden: true })}
      </div>`;
  },
  init() {
    const parseV4 = (s) => {
      s = s.trim();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return ipToInt(s);
      if (/^0x[0-9a-f]+$/i.test(s)) { const n = parseInt(s, 16); return n <= 0xffffffff ? n >>> 0 : null; }
      if (/^[01]{32}$/.test(s)) return parseInt(s, 2) >>> 0;
      if (/^\d+$/.test(s)) { const n = Number(s); return n <= 0xffffffff ? n >>> 0 : null; }
      return null;
    };
    const update = () => {
      const raw = $('#ipc-in').value;
      let rows = null;
      const g = parseIpv6(raw);
      if (g) {
        rows = {
          'Type': 'IPv6',
          'Expanded': v6Full(g),
          'Compressed': v6Compress(g),
          'Groups': g.map(x => x.toString(16).padStart(4, '0')).join(' '),
          'Reverse DNS': v6Reverse(g),
        };
        if (g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0xffff) {
          const v4 = ((g[6] << 16) | g[7]) >>> 0;
          rows['Embedded IPv4'] = intToIp(v4) + '  (IPv4-mapped)';
        }
      } else {
        const n = parseV4(raw);
        if (n === null || n === undefined) { $('#ipc-results').style.display = 'none'; return; }
        const u = n >>> 0;
        rows = {
          'Type': 'IPv4',
          'Dotted decimal': intToIp(u),
          'Decimal (integer)': String(u),
          'Hexadecimal': '0x' + u.toString(16).toUpperCase().padStart(8, '0'),
          'Octal': '0' + u.toString(8),
          'Binary': [24, 16, 8, 0].map(sh => ((u >>> sh) & 255).toString(2).padStart(8, '0')).join('.'),
          'Reverse DNS': v4Reverse(u),
          'IPv6 (mapped)': '::ffff:' + intToIp(u),
          'IPv6 (mapped, full)': '0000:0000:0000:0000:0000:ffff:' + ((u >>> 16) & 0xffff).toString(16).padStart(4, '0') + ':' + (u & 0xffff).toString(16).padStart(4, '0'),
        };
      }
      $('#ipc-out').innerHTML = Object.entries(rows).map(([k, v]) => `<dt>${k}</dt><dd><code>${escapeHtml(v)}</code></dd>`).join('');
      $('#ipc-results').style.display = 'block';
    };
    $('#ipc-in').addEventListener('input', update);
    update();
  }
};

TOOLS['ua-parser'] = {
  title: 'User-Agent Parser',
  desc: 'Parse a User-Agent string into browser, engine, OS, device, CPU architecture and bot status.',
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
      const isBot = /bot\b|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|python-requests|curl\/|wget|go-http|java\/|okhttp/i.test(ua);
      const botName = m(/(Googlebot|bingbot|DuckDuckBot|YandexBot|Baiduspider|facebookexternalhit|Twitterbot|Slackbot|AhrefsBot|SemrushBot|HeadlessChrome|python-requests|curl|Wget)/i, ua);

      let browser = 'Unknown', version = '';
      const set = (b, re) => { browser = b; version = m(re, ua); };
      if (/Edg(?:e|A|iOS)?\//.test(ua)) set('Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/);
      else if (/YaBrowser\//.test(ua)) set('Yandex', /YaBrowser\/([\d.]+)/);
      else if (/Vivaldi\//.test(ua)) set('Vivaldi', /Vivaldi\/([\d.]+)/);
      else if (/OPR\/|Opera/.test(ua)) set('Opera', /(?:OPR|Opera)\/([\d.]+)/);
      else if (/Brave\//.test(ua)) set('Brave', /Brave\/([\d.]+)/);
      else if (/SamsungBrowser\//.test(ua)) set('Samsung Internet', /SamsungBrowser\/([\d.]+)/);
      else if (/UCBrowser\//.test(ua)) set('UC Browser', /UCBrowser\/([\d.]+)/);
      else if (/Firefox\/|FxiOS\//.test(ua)) set('Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/);
      else if (/Chrome\/|CriOS\//.test(ua)) set('Chrome', /(?:Chrome|CriOS)\/([\d.]+)/);
      else if (/Safari\//.test(ua) && /Version\//.test(ua)) set('Safari', /Version\/([\d.]+)/);
      else if (/MSIE |Trident\//.test(ua)) set('Internet Explorer', /(?:MSIE |rv:)([\d.]+)/);
      else if (botName) browser = botName;

      let engine = 'Unknown';
      if (/Gecko\//.test(ua) && /Firefox/.test(ua)) engine = 'Gecko';
      else if (/AppleWebKit\//.test(ua)) engine = /Chrome|CriOS|Edg|OPR|YaBrowser|Vivaldi|Samsung/.test(ua) ? 'Blink' : 'WebKit';
      else if (/Trident\//.test(ua)) engine = 'Trident';
      const engVer = m(/AppleWebKit\/([\d.]+)/, ua) || m(/rv:([\d.]+)/, ua);

      let os = 'Unknown';
      if (/Windows NT 10/.test(ua)) os = 'Windows 10 / 11';
      else if (/Windows NT 6\.3/.test(ua)) os = 'Windows 8.1';
      else if (/Windows NT 6\.2/.test(ua)) os = 'Windows 8';
      else if (/Windows NT 6\.1/.test(ua)) os = 'Windows 7';
      else if (/Windows NT/.test(ua)) os = 'Windows';
      else if (/Android/.test(ua)) os = ('Android ' + m(/Android ([\d.]+)/, ua)).trim();
      else if (/iPhone|iPad|iPod/.test(ua)) os = ('iOS ' + m(/OS ([\d_]+)/, ua)).trim();
      else if (/Mac OS X/.test(ua)) os = ('macOS ' + m(/Mac OS X ([\d_]+)/, ua)).trim();
      else if (/CrOS/.test(ua)) os = 'ChromeOS';
      else if (/Ubuntu/.test(ua)) os = 'Ubuntu Linux';
      else if (/Linux/.test(ua)) os = 'Linux';

      const arch = /arm64|aarch64/i.test(ua) ? 'ARM64' : /Win64|x64|x86_64|WOW64|amd64/i.test(ua) ? 'x86-64 (64-bit)'
        : /armv|arm\b/i.test(ua) ? 'ARM' : /i[36]86|Win32|x86/i.test(ua) ? 'x86 (32-bit)' : 'Unknown';

      const model = m(/\(([^;]*; )?([A-Za-z0-9 _-]+) Build\//, ua) || m(/(iPhone|iPad|iPod)/, ua);
      const device = /Mobile|iPhone|iPod|Android.*Mobile/.test(ua) ? 'Mobile'
        : /iPad|Tablet|Android(?!.*Mobile)/.test(ua) ? 'Tablet'
        : isBot ? 'Bot' : 'Desktop';

      const rows = {
        'Browser': browser + (version ? ' ' + version : ''),
        'Engine': engine + (engVer ? ' ' + engVer : ''),
        'Operating system': os,
        'Device type': device,
        'CPU architecture': arch,
        'Bot / automated': isBot ? 'Yes' + (botName ? ' (' + botName + ')' : '') : 'No',
      };
      if (model) rows['Device model'] = model;
      return rows;
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
