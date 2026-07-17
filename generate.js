const fs = require('fs');

// ═══ DATA ═══
const baseNodes = [
  [34,343],[92,312],[165,329],[223,392],[317,362],       // 0-4
  [406,386],[520,338],[621,350],[724,392],[827,337],      // 5-9
  [936,365],[1038,320],[1147,345],[1266,314],[1376,343],  // 10-14
  [54,201],[154,427],[253,497],[348,470],[431,493],       // 15-19
  [548,493],[190,254],[270,282],[357,266],[452,272],      // 20-24
  [502,140],[601,195],[548,238],[624,86],[723,122],       // 25-29
  [681,242],[801,72],[864,153],[781,146],[932,218],       // 30-34
  [966,101],[1044,121],[1116,195],[1083,280],[1215,166],  // 35-39
  [1283,218],[1343,269],[894,426],[965,491],[1004,402],   // 40-44
  [1075,484],[1116,412],[1185,489],[1220,407],            // 45-48
  [661,243],[681,448],[1190,240]                          // 49-51 (edge-only nodes)
];

// All 14 polylines from the base network
const allPolylines = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],
  [15,1,16,3,17,18,5,19,20,7],
  [2,21,22,4,23,24,6,27,49,8],
  [24,25,26,27,28,29,30,9],
  [28,29,31,32,9,10],
  [31,33,32,34,11],
  [34,35,36,37,38,12],
  [36,37,39,40,13],
  [37,51,40,41,14],
  [9,42,44,11,46,48,13],
  [42,43,44,45,46,47,48],
  [17,18,19,6,20,50,8],
  [1,16,3,4,5,24,27,7],
  [27,49,50,9,34,35]
];

// Bright flow layer 1 polylines
const flow1 = [
  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14],
  [1,16,3,4,5,24,27,7],
  [24,25,26,27,28,29,30,9],
  [34,35,36,37,38,12],
  [9,42,44,11,46,48,13],
  [27,49,50,9,34,35]
];

// Bright flow layer 2 polylines
const flow2 = [
  [15,1,16,3,17,18,5,19,20,7],
  [2,21,22,4,23,24,6,27,49,8],
  [28,29,31,32,9,10],
  [31,33,32,34,11],
  [36,37,39,40,13],
  [42,43,44,45,46,47,48]
];

const CIRCLE_COUNT = 49; // indices 0-48 get visible circles
const K = 11;            // more keyframes = more varied random paths
const DUR = '15s';       // faster cycle

// ═══ PSEUDO-RANDOM (multi-hash for better distribution) ═══
function prand(seed) {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  x = Math.sin(x * 269.3 + 183.1) * 28461.7231;
  return x - Math.floor(x);
}

function offset(ni, ki, axis) {
  if (ki === K - 1) return offset(ni, 0, axis); // seamless loop
  // Multiple mixed seeds for better randomness
  const s1 = ni * 1301 + ki * 257 + (axis === 'x' ? 37 : 73);
  const s2 = ni * 853 + ki * 419 + (axis === 'x' ? 53 : 97);
  const r = (prand(s1) + prand(s2)) / 2; // average two hashes
  const amp = 25 + (prand(ni * 571 + 17) * 20); // 25–45 px per node
  return Math.round((r * 2 - 1) * amp);
}

// ═══ PRECOMPUTE ═══
const pos = baseNodes.map((b, ni) =>
  Array.from({ length: K }, (_, ki) => [
    b[0] + offset(ni, ki, 'x'),
    b[1] + offset(ni, ki, 'y')
  ])
);

const keyTimes = Array.from({ length: K }, (_, i) =>
  (i / (K - 1)).toFixed(3)
).join(';');

const spline = '0.42 0 0.58 1';
const keySplines = Array(K - 1).fill(spline).join(';');

// ═══ GENERATORS ═══
function animatePolyline(indices) {
  const basePoints = indices.map(n => `${baseNodes[n][0]},${baseNodes[n][1]}`).join(' ');
  const vals = Array.from({ length: K }, (_, ki) =>
    indices.map(n => `${pos[n][ki][0]},${pos[n][ki][1]}`).join(' ')
  ).join(';');
  return (
    `<polyline points="${basePoints}">` +
    `<animate attributeName="points" values="${vals}" keyTimes="${keyTimes}" ` +
    `calcMode="spline" keySplines="${keySplines}" dur="${DUR}" repeatCount="indefinite"/>` +
    `</polyline>`
  );
}

function animateCircle(ni, r) {
  const [bx, by] = baseNodes[ni];
  const cxv = pos[ni].map(p => p[0]).join(';');
  const cyv = pos[ni].map(p => p[1]).join(';');
  const anim =
    `<animate attributeName="cx" values="${cxv}" keyTimes="${keyTimes}" calcMode="spline" keySplines="${keySplines}" dur="${DUR}" repeatCount="indefinite"/>` +
    `<animate attributeName="cy" values="${cyv}" keyTimes="${keyTimes}" calcMode="spline" keySplines="${keySplines}" dur="${DUR}" repeatCount="indefinite"/>`;
  return `<circle cx="${bx}" cy="${by}" r="${r}">${anim}</circle>`;
}

// ═══ BUILD SVG ═══
const L = [];
const push = s => L.push(s);

push(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="520" viewBox="0 0 1400 520" role="img" aria-labelledby="title desc">`);
push(`  <title id="title">Pranav Karhale profile header</title>`);
push(`  <desc id="desc">Dark terminal themed GitHub README header with animated green network.</desc>`);

// Defs
push(`  <defs>`);
push(`    <filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
push(`    <filter id="ng" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
push(`  </defs>`);

// Background
push(`  <rect width="1400" height="520" rx="4" fill="#121010"/>`);

// CSS for dash-flow + pulse (visual effects on top of SMIL position movement)
push(`  <style>`);
push(`    .wf polyline{stroke-dasharray:40 260;stroke-dashoffset:0;animation:nf 4.5s linear infinite;filter:url(#gl)}`);
push(`    .wf polyline:nth-child(2n){stroke-dasharray:55 220;animation-duration:6.2s;animation-direction:reverse}`);
push(`    .wf polyline:nth-child(3n){stroke-dasharray:35 280;animation-duration:5s;animation-delay:-1.8s}`);
push(`    .wf polyline:nth-child(4n){stroke-dasharray:45 240;animation-duration:7s;animation-delay:-3.2s}`);
push(`    .wf polyline:nth-child(5n){stroke-dasharray:50 250;animation-duration:5.5s;animation-direction:reverse;animation-delay:-.6s}`);
push(`    .wf2 polyline{stroke-dasharray:25 300;animation:nfr 5.8s linear infinite;filter:url(#gl)}`);
push(`    .wf2 polyline:nth-child(2n){stroke-dasharray:35 280;animation-duration:7.5s;animation-delay:-2.5s}`);
push(`    .wf2 polyline:nth-child(3n){stroke-dasharray:20 310;animation-duration:4.8s;animation-direction:reverse;animation-delay:-1.2s}`);
push(`    .np circle{animation:np1 2.9s ease-in-out infinite;transform-box:fill-box;transform-origin:center}`);
push(`    .np circle:nth-child(2n){animation:np2 3.4s ease-in-out infinite}`);
push(`    .np circle:nth-child(3n){animation:np1 2.2s ease-in-out infinite;animation-delay:-.9s}`);
push(`    .np circle:nth-child(5n){animation:np2 2.5s ease-in-out infinite;animation-delay:-.4s}`);
push(`    .nb circle{animation:nb 3.5s ease-in-out infinite;transform-box:fill-box;transform-origin:center;filter:url(#ng)}`);
push(`    .nb circle:nth-child(2n){animation-duration:2.8s;animation-delay:-1.4s}`);
push(`    .nb circle:nth-child(3n){animation-duration:4.2s;animation-delay:-.7s}`);
push(`    .nb circle:nth-child(5n){animation-duration:2.1s;animation-delay:-1.9s}`);
push(`    @keyframes nf{to{stroke-dashoffset:-300}}`);
push(`    @keyframes nfr{to{stroke-dashoffset:325}}`);
push(`    @keyframes np1{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:1;transform:scale(1.35)}}`);
push(`    @keyframes np2{0%,100%{opacity:.5;transform:scale(.85)}35%{opacity:1;transform:scale(1.2)}70%{opacity:.6;transform:scale(.9)}}`);
push(`    @keyframes nb{0%,100%{opacity:.15;transform:scale(.5)}30%{opacity:.8;transform:scale(1.8)}50%{opacity:1;transform:scale(2.2)}70%{opacity:.6;transform:scale(1.5)}}`);
push(`    @media(prefers-reduced-motion:reduce){.wf polyline,.wf2 polyline,.np circle,.nb circle{animation:none}}`);
push(`  </style>`);

// Layer 1: Dim base network (all polylines, physically moving)
push(`  <g opacity="0.42" stroke="#008a16" stroke-width="1" fill="none">`);
allPolylines.forEach(pl => push(`    ${animatePolyline(pl)}`));
push(`  </g>`);

// Layer 2: Bright flow 1 (dash animation + physical movement)
push(`  <g class="wf" opacity="0.92" stroke="#00dd3b" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">`);
flow1.forEach(pl => push(`    ${animatePolyline(pl)}`));
push(`  </g>`);

// Layer 3: Bright flow 2 (counter-phase dash + physical movement)
push(`  <g class="wf2" opacity="0.7" stroke="#00ff44" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round">`);
flow2.forEach(pl => push(`    ${animatePolyline(pl)}`));
push(`  </g>`);

// Layer 4: Base nodes (pulse + physical movement)
push(`  <g class="np" opacity="0.95" fill="#00b323">`);
for (let i = 0; i < CIRCLE_COUNT; i++) push(`    ${animateCircle(i, 2.5)}`);
push(`  </g>`);

// Layer 5: Bright node halos (glow pulse + physical movement)
push(`  <g class="nb" fill="#00ff44">`);
for (let i = 0; i < CIRCLE_COUNT; i++) push(`    ${animateCircle(i, 3.5)}`);
push(`  </g>`);

// Text
push(`  <g font-family="Consolas, 'Courier New', monospace" fill="#f4f4f4">`);
push(`    <text x="36" y="50" font-size="20" font-weight="700">Command Center</text>`);
push(`    <text x="136" y="168" font-size="58" font-weight="900" letter-spacing="1">Pranav Karhale</text>`);
push(`    <text x="137" y="216" font-size="24" font-weight="700">B.Tech IT @ IIIT Allahabad</text>`);
push(`    <text x="137" y="268" font-size="21" font-weight="700">Full-stack developer | AI/ML builder | CP grinder </text>`);
push(`    <text x="137" y="315" font-size="19" font-weight="700">Designing full-stack products with AI inside</text>`);
push(`    <text x="137" y="344" font-size="19" font-weight="700">Building LangGraph agents, RAG, and MCP systems</text>`);
push(`    <text x="137" y="373" font-size="19" font-weight="700">Shipping cloud-ready apps with Docker and Kubernetes</text>`);
push(`    <text x="137" y="402" font-size="19" font-weight="700">Solving CP problems to keep implementation speed sharp</text>`);
push(`  </g>`);
push(`  <g font-family="Consolas, 'Courier New', monospace" font-size="18" font-weight="700">`);
push(`    <text x="137" y="455" fill="#f4f4f4">Open to opportunities</text>`);
push(`    <text x="350" y="455" fill="#008a16">Prayagraj, India</text>`);
push(`    <text x="535" y="455" fill="#f4f4f4">AI Systems</text>`);
push(`    <text x="670" y="455" fill="#008a16">Build and Ship</text>`);
push(`  </g>`);

push(`</svg>`);

// Write output
const svg = L.join('\n');
fs.writeFileSync('header.svg', svg);
console.log(`Generated header.svg (${(svg.length / 1024).toFixed(1)} KB)`);
