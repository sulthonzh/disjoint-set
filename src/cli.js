#!/usr/bin/env node
import { DisjointSet, kruskal } from './index.js';

const args = process.argv.slice(2);
const cmd = args[0];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });
}

function help() {
  console.log(`disjoint-set — Union-Find CLI

Commands:
  union <a> <b>           Union two elements (reads all from --elements)
  connected <a> <b>      Check if connected
  find <value>            Find root of element
  components              List all components
  stats                   Show stats
  kruskal                 MST from stdin edges (u v w per line)
  demo                    Run a demo

Options:
  --elements <csv>        Comma-separated initial elements
  --json                  JSON output
  -h, --help              Show this help

Examples:
  dsu union a b --elements=a,b,c,d
  dsu connected a b --elements=a,b
  echo "0 1 4\\n1 2 2\\n0 2 3" | dsu kruskal --elements=3
`);
}

const flags = {};
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    flags[key] = val;
  } else {
    positional.push(args[i]);
  }
}

function buildDSU() {
  if (flags.elements) {
    const items = String(flags.elements).split(',').map((s) => s.trim());
    return new DisjointSet(items);
  }
  return null;
}

if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
  help();
  process.exit(0);
}

if (cmd === 'demo') {
  const dsu = new DisjointSet(['A', 'B', 'C', 'D', 'E']);
  dsu.union('A', 'B');
  dsu.union('C', 'D');
  console.log('After union(A,B) and union(C,D):');
  console.log('components:', dsu.components());
  console.log('A connected to B?', dsu.connected('A', 'B'));
  console.log('A connected to C?', dsu.connected('A', 'C'));
  dsu.union('B', 'C');
  console.log('\nAfter union(B,C):');
  console.log('A connected to D?', dsu.connected('A', 'D'));
  console.log('components:', dsu.components());
  console.log('\nKruskal MST demo:');
  const result = kruskal(4, [[0,1,1],[1,2,2],[0,2,3],[2,3,4],[1,3,5]]);
  console.log('edges:', result.mst.map(e => e.join(' ↔ ')).join(', '));
  console.log('total weight:', result.weight);
  process.exit(0);
}

if (cmd === 'kruskal') {
  const stdin = await readStdin();
  const n = parseInt(flags.elements) || 0;
  const edges = stdin.trim().split('\n').filter(Boolean).map((line) => {
    const [u, v, w] = line.trim().split(/\s+/).map(Number);
    return [u, v, w];
  });
  const result = kruskal(n || Math.max(...edges.flat()) + 1, edges);
  if (flags.json) {
    console.log(JSON.stringify(result));
  } else {
    console.log('MST edges:');
    for (const [u, v, w] of result.mst) console.log(`  ${u} ↔ ${v} (weight ${w})`);
    console.log(`Total weight: ${result.weight}`);
    console.log(`Connected: ${result.connected}`);
  }
  process.exit(0);
}

const dsu = buildDSU();
if (!dsu) {
  console.error('Error: --elements is required for this command');
  process.exit(1);
}

// Parse union commands from positional args (support multiple pairs)
if (cmd === 'union') {
  // remaining positional: pairs like "a b c d" → union(a,b) union(c,d)
  for (let i = 1; i < positional.length; i += 2) {
    if (positional[i + 1]) dsu.union(positional[i], positional[i + 1]);
  }
  if (flags.json) {
    console.log(JSON.stringify({ components: dsu.components(), count: dsu.componentCount }));
  } else {
    console.log('Components:', dsu.components().map((c) => `{${c.join(', ')}}`).join(' '));
    console.log(`(${dsu.componentCount} component${dsu.componentCount !== 1 ? 's' : ''})`);
  }
} else if (cmd === 'connected') {
  const [a, b] = [positional[1], positional[2]];
  const result = dsu.connected(a, b);
  if (flags.json) {
    console.log(JSON.stringify({ a, b, connected: result }));
  } else {
    console.log(`${a} and ${b}: ${result ? 'connected ✓' : 'not connected ✗'}`);
  }
} else if (cmd === 'find') {
  const v = positional[1];
  const root = dsu.findValue(v);
  if (flags.json) {
    console.log(JSON.stringify({ value: v, root }));
  } else {
    console.log(`Root of ${v}: ${root}`);
  }
} else if (cmd === 'components') {
  const comps = dsu.components();
  if (flags.json) {
    console.log(JSON.stringify(comps));
  } else {
    comps.forEach((c, i) => console.log(`[${i}] {${c.join(', ')}}`));
    console.log(`Total: ${comps.length}`);
  }
} else if (cmd === 'stats') {
  const stats = { elements: dsu.size, components: dsu.componentCount, sizes: dsu.components().map((c) => c.length) };
  if (flags.json) {
    console.log(JSON.stringify(stats));
  } else {
    console.log(`Elements: ${stats.elements}`);
    console.log(`Components: ${stats.components}`);
    console.log(`Sizes: ${stats.sizes.join(', ')}`);
  }
} else {
  help();
}
