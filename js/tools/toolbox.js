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

// ===== CISCO IOS COMMAND CHEATSHEET =====
const CISCO = [
  { s: 'Modes & basics', items: [
    ['enable', 'User EXEC to privileged EXEC mode', '>'],
    ['disable', 'Drop back to user EXEC', '#'],
    ['configure terminal', 'Enter global configuration mode', '#'],
    ['exit', 'Leave the current mode (one level up)', 'any'],
    ['end', 'Jump straight back to privileged EXEC', '(config)#'],
    ['hostname R1', 'Set the device name', '(config)#'],
    ['do show ip interface brief', 'Run an EXEC command from config mode', '(config)#'],
    ['no <command>', 'Negate / remove any command', 'any'],
    ['?', 'Context help (list available commands)', 'any'],
    ['reload', 'Reboot the device', '#'],
  ]},
  { s: 'Save & files', items: [
    ['copy running-config startup-config', 'Save the running config to NVRAM', '#'],
    ['write memory', 'Older shortcut to save the config', '#'],
    ['show running-config', 'Display the active configuration', '#'],
    ['show startup-config', 'Display the saved configuration', '#'],
    ['erase startup-config', 'Wipe the saved config (factory-ish reset)', '#'],
    ['copy running-config tftp', 'Back the config up to a TFTP server', '#'],
  ]},
  { s: 'Passwords & remote access', items: [
    ['enable secret cisco123', 'Set an encrypted privileged-mode password', '(config)#'],
    ['service password-encryption', 'Encrypt all plaintext passwords in the config', '(config)#'],
    ['line console 0', 'Configure the console line', '(config)#'],
    ['password cisco / login', 'Set + require a password on a line', '(config-line)#'],
    ['line vty 0 4', 'Configure the 5 Telnet/SSH virtual lines', '(config)#'],
    ['transport input ssh', 'Allow only SSH on the VTY lines', '(config-line)#'],
    ['username admin secret pass', 'Create a local user for SSH login', '(config)#'],
    ['ip domain-name lab.local', 'Set a domain (needed for SSH keys)', '(config)#'],
    ['crypto key generate rsa', 'Generate RSA keys to enable SSH', '(config)#'],
    ['banner motd #Authorized only#', 'Set the message-of-the-day banner', '(config)#'],
  ]},
  { s: 'Layer 1 - Interfaces', items: [
    ['interface gigabitEthernet 0/0', 'Enter a physical interface', '(config)#'],
    ['interface range fa0/1 - 12', 'Configure several interfaces at once', '(config)#'],
    ['description LINK-TO-SW1', 'Label the interface', '(config-if)#'],
    ['no shutdown', 'Enable (bring up) the interface', '(config-if)#'],
    ['shutdown', 'Administratively disable the interface', '(config-if)#'],
    ['speed 1000 / duplex full', 'Force speed and duplex', '(config-if)#'],
    ['show ip interface brief', 'Quick status of every interface', '#'],
    ['show interfaces status', 'Port status, VLAN, speed, duplex (switch)', '#'],
  ]},
  { s: 'Layer 2 - VLANs & switching', items: [
    ['vlan 10', 'Create a VLAN and enter VLAN config', '(config)#'],
    ['name SALES', 'Name the VLAN', '(config-vlan)#'],
    ['switchport mode access', 'Make the port an access port', '(config-if)#'],
    ['switchport access vlan 10', 'Assign the access port to a VLAN', '(config-if)#'],
    ['switchport mode trunk', 'Make the port a trunk', '(config-if)#'],
    ['switchport trunk allowed vlan 10,20', 'Restrict which VLANs cross the trunk', '(config-if)#'],
    ['switchport trunk native vlan 99', 'Set the untagged (native) VLAN', '(config-if)#'],
    ['show vlan brief', 'List VLANs and their ports', '#'],
    ['show interfaces trunk', 'Show trunk ports and allowed VLANs', '#'],
    ['show mac address-table', 'Show learned MAC-to-port mappings', '#'],
  ]},
  { s: 'Layer 2 - STP & port security', items: [
    ['spanning-tree vlan 1 root primary', 'Make this switch the root bridge', '(config)#'],
    ['spanning-tree portfast', 'Skip STP listening/learning on an edge port', '(config-if)#'],
    ['spanning-tree bpduguard enable', 'Shut the port if a BPDU is seen', '(config-if)#'],
    ['switchport port-security', 'Enable port security on the port', '(config-if)#'],
    ['switchport port-security maximum 2', 'Limit how many MACs the port learns', '(config-if)#'],
    ['switchport port-security mac-address sticky', 'Learn and save the MAC dynamically', '(config-if)#'],
    ['switchport port-security violation shutdown', 'Action on a violation (shutdown/restrict/protect)', '(config-if)#'],
    ['show port-security', 'Show port-security status and counters', '#'],
    ['show spanning-tree', 'Show STP roles, states and root bridge', '#'],
  ]},
  { s: 'Layer 3 - IP & routing', items: [
    ['ip address 192.168.1.1 255.255.255.0', 'Set an interface IPv4 address', '(config-if)#'],
    ['interface vlan 10 / ip address ...', 'Create an SVI for inter-VLAN routing', '(config)#'],
    ['ip default-gateway 192.168.1.1', 'Default gateway for a L2 switch', '(config)#'],
    ['ip routing', 'Enable routing on a L3 switch', '(config)#'],
    ['ip route 10.0.0.0 255.0.0.0 192.168.1.2', 'Add a static route', '(config)#'],
    ['ip route 0.0.0.0 0.0.0.0 192.168.1.2', 'Add a default route', '(config)#'],
    ['router ospf 1', 'Start an OSPF process', '(config)#'],
    ['network 192.168.1.0 0.0.0.255 area 0', 'Advertise a network into OSPF', '(config-router)#'],
    ['router eigrp 100', 'Start an EIGRP autonomous system', '(config)#'],
    ['router rip / version 2', 'Start RIP and use v2', '(config)#'],
    ['show ip route', 'Show the routing table', '#'],
    ['show ip ospf neighbor', 'Show OSPF adjacencies', '#'],
  ]},
  { s: 'Services - DHCP, NAT, ACL', items: [
    ['ip dhcp excluded-address 192.168.1.1 192.168.1.10', 'Reserve addresses from a pool', '(config)#'],
    ['ip dhcp pool LAN', 'Create a DHCP pool', '(config)#'],
    ['network 192.168.1.0 255.255.255.0', 'Pool subnet', '(dhcp-config)#'],
    ['default-router 192.168.1.1', 'Gateway handed out by DHCP', '(dhcp-config)#'],
    ['dns-server 8.8.8.8', 'DNS server handed out by DHCP', '(dhcp-config)#'],
    ['access-list 10 permit 192.168.1.0 0.0.0.255', 'Standard ACL entry', '(config)#'],
    ['ip access-group 10 in', 'Apply an ACL to an interface', '(config-if)#'],
    ['ip nat inside / ip nat outside', 'Mark NAT inside/outside interfaces', '(config-if)#'],
    ['ip nat inside source list 1 interface g0/0 overload', 'Configure PAT (NAT overload)', '(config)#'],
    ['show ip nat translations', 'Show active NAT translations', '#'],
  ]},
  { s: 'Verify & troubleshoot', items: [
    ['show version', 'IOS version, uptime, hardware', '#'],
    ['ping 8.8.8.8', 'Test reachability', '#'],
    ['traceroute 8.8.8.8', 'Trace the path hop by hop', '#'],
    ['show cdp neighbors', 'Discover directly connected Cisco devices', '#'],
    ['show ip protocols', 'Show running routing protocols', '#'],
    ['show interfaces', 'Detailed interface counters and errors', '#'],
    ['terminal monitor', 'See log/debug output over an SSH/Telnet session', '#'],
    ['debug ip packet', 'Live packet debug (use with care)', '#'],
  ]},
];

TOOLS['cisco'] = {
  title: 'Cisco IOS Cheatsheet',
  desc: 'Searchable Cisco IOS / Packet Tracer command reference grouped by task and layer, with the mode for each.',
  render() {
    const body = CISCO.map(g => `<div class="cli-group" data-grp>${g.s}</div>` + g.items.map(([c, d, m]) =>
      `<div class="cli-row" data-f="${escapeHtml((c + ' ' + d + ' ' + g.s).toLowerCase())}"><code class="cli-cmd" data-copy="${escapeHtml(c)}" title="Click to copy">${escapeHtml(c)}</code><span class="cli-desc">${escapeHtml(d)}</span><span class="cli-mode">${escapeHtml(m)}</span></div>`
    ).join('')).join('');
    return `
      <div class="tool">
        ${card('Cisco IOS Cheatsheet', `
          <input type="text" class="input cli-search" id="cli-search" placeholder="Filter by command, description or section..." autocomplete="off">
          <div class="net-legend">Click a command to copy it. The right column is the mode it runs in (the prompt).</div>
          <div id="cli-body">${body}</div>
        `)}
      </div>`;
  },
  init() {
    const body = $('#cli-body'), search = $('#cli-search');
    wireCopyAll(body);
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      let any = false;
      $$('.cli-row', body).forEach(r => { const show = !q || r.dataset.f.includes(q); r.style.display = show ? '' : 'none'; if (show) any = true; });
      $$('.cli-group', body).forEach(g => { let n = g.nextElementSibling, vis = false; while (n && !n.classList.contains('cli-group')) { if (n.classList.contains('cli-row') && n.style.display !== 'none') { vis = true; break; } n = n.nextElementSibling; } g.style.display = vis ? '' : 'none'; });
      let em = $('.cli-empty', body); if (!any) { if (!em) { em = el('div', { class: 'cli-empty' }, 'No matching commands.'); body.appendChild(em); } em.style.display = ''; } else if (em) em.style.display = 'none';
    });
  }
};
