const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, 'scheduler (3)');
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir) {
  const res = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      res.push(...walk(full));
    } else if (stat.isFile() && exts.includes(path.extname(full))) {
      res.push(full);
    }
  }
  return res;
}

function resolveImport(fromFile, imp) {
  // only handle local or alias @ imports
  if (!imp.startsWith('./') && !imp.startsWith('../') && !imp.startsWith('@/')) return null;
  let base;
  if (imp.startsWith('@/')) {
    base = path.resolve(root, imp.slice(2));
  } else {
    base = path.resolve(path.dirname(fromFile), imp);
  }
  // try file with extensions
  for (const e of exts) {
    const cand = base + e;
    if (fs.existsSync(cand)) return cand;
  }
  // try index.*
  for (const e of exts) {
    const cand = path.join(base, 'index' + e);
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

const files = walk(root);
const imports = new Map();
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const re = /import[^;]*from\s*["']([^"']+)["']/g;
  let m;
  const deps = new Set();
  while (m = re.exec(txt)) {
    const imp = m[1];
    const resolved = resolveImport(f, imp);
    if (resolved) deps.add(resolved);
  }
  imports.set(f, Array.from(deps));
}

// detect cycles
const visited = new Set();
const stack = new Set();
const cycles = [];

function dfs(node, pathArr) {
  if (stack.has(node)) {
    const idx = pathArr.indexOf(node);
    cycles.push(pathArr.slice(idx).concat(node));
    return;
  }
  if (visited.has(node)) return;
  visited.add(node);
  stack.add(node);
  const deps = imports.get(node) || [];
  for (const d of deps) dfs(d, pathArr.concat([node]));
  stack.delete(node);
}

for (const f of imports.keys()) dfs(f, []);

if (cycles.length === 0) {
  console.log('No cycles detected');
  process.exit(0);
}
console.log('Cycles detected:');
for (const c of cycles) {
  console.log(c.map(p => path.relative(root, p)).join(' -> '));
}
process.exit(0);
