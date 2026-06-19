/* ============================================================
   NetKit - Toolbox: interactive OSI model (loaded after js/core.js)
   ============================================================ */

const OSI = [
  { n: 7, name: 'Application', pdu: 'Data', tcpip: 'Application', color: '#3b82f6',
    func: 'Provides network services directly to user applications — the interface people actually interact with.',
    protocols: ['HTTP/HTTPS', 'DNS', 'DHCP', 'FTP', 'SMTP', 'IMAP/POP3', 'SSH', 'Telnet', 'SNMP'],
    devices: ['Hosts', 'L7 firewall / WAF', 'Proxy / API gateway'],
    keywords: ['user data', 'requests', 'APIs'],
    security: ['Phishing', 'App exploits (SQLi/XSS)', 'L7 DDoS', 'API abuse'] },
  { n: 6, name: 'Presentation', pdu: 'Data', tcpip: 'Application', color: '#6366f1',
    func: 'Translates, encrypts and compresses data — formatting and syntax so both ends understand it.',
    protocols: ['TLS/SSL', 'ASCII/Unicode', 'JPEG/PNG/GIF', 'MPEG', 'MIME'],
    devices: ['Host software', 'TLS offloaders'],
    keywords: ['encryption', 'compression', 'encoding'],
    security: ['Weak ciphers', 'SSL stripping', 'Certificate flaws'] },
  { n: 5, name: 'Session', pdu: 'Data', tcpip: 'Application', color: '#8b5cf6',
    func: 'Establishes, manages and tears down sessions (dialogs) between applications.',
    protocols: ['NetBIOS', 'RPC', 'PPTP', 'SOCKS', 'SQL sessions'],
    devices: ['Hosts'],
    keywords: ['sessions', 'dialog control', 'checkpoints'],
    security: ['Session hijacking', 'Session fixation'] },
  { n: 4, name: 'Transport', pdu: 'Segment / Datagram', tcpip: 'Transport', color: '#06b6d4',
    func: 'End-to-end delivery between hosts: ports, segmentation, reliability, flow and congestion control.',
    protocols: ['TCP', 'UDP', 'SCTP', 'QUIC'],
    devices: ['L4 load balancer', 'Stateful firewall'],
    keywords: ['ports', 'segments', '3-way handshake', 'windowing'],
    security: ['SYN flood', 'Port scanning', 'UDP flood'] },
  { n: 3, name: 'Network', pdu: 'Packet', tcpip: 'Internet', color: '#14b8a6',
    func: 'Logical addressing and routing of packets between different networks.',
    protocols: ['IPv4/IPv6', 'ICMP', 'IPsec', 'OSPF', 'BGP', 'EIGRP'],
    devices: ['Routers', 'L3 switches'],
    keywords: ['IP address', 'routing', 'TTL', 'fragmentation'],
    security: ['IP spoofing', 'Routing attacks', 'ICMP tunneling'] },
  { n: 2, name: 'Data Link', pdu: 'Frame', tcpip: 'Network Access', color: '#22c55e',
    func: 'Node-to-node delivery on the same link: MAC addressing, framing, error detection and media access.',
    protocols: ['Ethernet', 'ARP', 'PPP', 'STP', '802.1Q VLAN', 'HDLC'],
    devices: ['Switches', 'Bridges', 'NICs', 'Access points'],
    keywords: ['MAC address', 'frames', 'FCS / CRC', 'VLAN'],
    security: ['ARP spoofing', 'MAC flooding', 'VLAN hopping'] },
  { n: 1, name: 'Physical', pdu: 'Bits', tcpip: 'Network Access', color: '#f59e0b',
    func: 'Transmits raw bits over the physical medium — cables, connectors, signals and radio.',
    protocols: ['Ethernet PHY', 'RJ45', 'Fiber', '802.11 radio', 'DSL', 'USB'],
    devices: ['Hubs', 'Repeaters', 'Cables', 'Transceivers'],
    keywords: ['bits', 'voltage / light', 'signaling', 'medium'],
    security: ['Wiretapping', 'Jamming', 'Physical access'] },
];

TOOLS['osi'] = {
  title: 'OSI Model',
  desc: 'Interactive 7-layer OSI model: click a layer for its PDU, protocols, devices and attacks, plus encapsulation.',
  render() {
    const stack = OSI.map(l => `<button class="osi-layer" data-n="${l.n}" style="--lc:${l.color}">
        <span class="osi-num">L${l.n}</span><span class="osi-name">${l.name}</span><span class="osi-pdu">${l.pdu}</span>
      </button>`).join('');
    const enc = (lbl, boxes) => `<div class="enc-row"><span class="enc-label">${lbl}</span><div class="enc-boxes">${boxes.map(b => `<span class="enc-box enc-${b[0]}">${b[1]}</span>`).join('')}</div></div>`;
    const encap = `
      ${enc('L7-5 · Data', [['data', 'Application data']])}
      ${enc('L4 · Segment', [['tcp', 'TCP/UDP'], ['data', 'Data']])}
      ${enc('L3 · Packet', [['ip', 'IP'], ['tcp', 'TCP/UDP'], ['data', 'Data']])}
      ${enc('L2 · Frame', [['eth', 'Eth'], ['ip', 'IP'], ['tcp', 'TCP/UDP'], ['data', 'Data'], ['fcs', 'FCS']])}
      ${enc('L1 · Bits', [['bits', '0101101001011100 1011010010110100 ...']])}`;
    return `
      <div class="tool">
        ${card('OSI Layers', `<div class="osi-stack" id="osi-stack">${stack}</div>
          <div class="osi-mnemonic">Mnemonic 1->7: <b>P</b>lease <b>D</b>o <b>N</b>ot <b>T</b>hrow <b>S</b>ausage <b>P</b>izza <b>A</b>way · 7->1: <b>A</b>ll <b>P</b>eople <b>S</b>eem <b>T</b>o <b>N</b>eed <b>D</b>ata <b>P</b>rocessing</div>`)}
        ${card('', `<div id="osi-detail"></div>`, { id: 'osi-detail-card' })}
        ${card('Encapsulation', `<div class="osi-encap">${encap}</div><div class="net-legend">Going down the stack, each layer wraps the data above it in its own header (and the frame adds a trailer).</div>`)}
      </div>`;
  },
  init() {
    const chips = (items, sec) => `<div class="osi-chips">${items.map(x => `<span class="osi-chip${sec ? ' sec' : ''}">${escapeHtml(x)}</span>`).join('')}</div>`;
    const detail = (l) => `
      <h3 class="osi-dh" style="color:${l.color}">Layer ${l.n} &mdash; ${escapeHtml(l.name)}</h3>
      <p class="osi-func">${escapeHtml(l.func)}</p>
      <dl class="info-grid"><dt>PDU</dt><dd>${escapeHtml(l.pdu)}</dd><dt>TCP/IP layer</dt><dd>${escapeHtml(l.tcpip)}</dd></dl>
      <div class="osi-sec-title">Protocols</div>${chips(l.protocols)}
      <div class="osi-sec-title">Devices</div>${chips(l.devices)}
      <div class="osi-sec-title">Keywords</div>${chips(l.keywords)}
      <div class="osi-sec-title">Attacks &amp; risks</div>${chips(l.security, true)}`;
    const select = (n) => {
      const l = OSI.find(x => x.n === n); if (!l) return;
      $('#osi-detail').innerHTML = detail(l);
      $$('.osi-layer').forEach(b => b.classList.toggle('active', +b.dataset.n === n));
    };
    $$('.osi-layer').forEach(b => b.addEventListener('click', () => select(+b.dataset.n)));
    select(7);
  }
};
