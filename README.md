# disjoint-set

Zero-dependency [Union-Find](https://en.wikipedia.org/wiki/Disjoint-set_data_structure) (Disjoint Set Union) for JavaScript.

Path compression + union by rank → **O(α(n)) amortized** per operation, where α is the inverse Ackermann function (effectively constant for any practical input).

## Install

```bash
npm install disjoint-set
```

## Why?

Union-Find is the go-to data structure when you need to:
- Track connected components in a graph
- Detect cycles (Kruskal's MST algorithm)
- Merge sets efficiently
- Check "are these two things in the same group?" — fast

It's one of those data structures that shows up everywhere once you know it. Network connectivity, image segmentation, percolation theory, game boards, build systems...

## Quick Start

```js
import { DisjointSet } from 'disjoint-set';

const dsu = new DisjointSet(['Alice', 'Bob', 'Carol', 'Dave']);

dsu.union('Alice', 'Bob');   // Alice and Bob are friends
dsu.union('Carol', 'Dave');   // Carol and Dave are friends

dsu.connected('Alice', 'Bob');    // true
dsu.connected('Alice', 'Carol');  // false

dsu.union('Bob', 'Carol');  // Now everyone is connected

dsu.componentCount;  // 1
dsu.setSize('Alice');  // 4
dsu.components();   // [['Alice', 'Bob', 'Carol', 'Dave']]
```

## API

### `new DisjointSet(initial?)`
Create a new disjoint set. Pass an iterable to pre-populate.
```js
const dsu = new DisjointSet([1, 2, 3, 4, 5]);
```

### `dsu.makeSet(value)` → `index`
Add a new singleton set. Throws if value already exists.

### `dsu.add(value)` → `index`
Like `makeSet` but idempotent (no throw on duplicates).

### `dsu.find(valueOrIndex)` → `rootIndex`
Find the root of the tree containing `value`. Uses path compression.

### `dsu.findValue(value)` → `rootValue`
Like `find` but returns the root's value instead of its index.

### `dsu.union(a, b)` → `boolean`
Merge the sets containing `a` and `b`. Returns `true` if a merge happened, `false` if already in the same set.

### `dsu.connected(a, b)` → `boolean`
Check if `a` and `b` are in the same set.

### `dsu.setSize(value)` → `number`
Get the number of elements in the set containing `value`.

### `dsu.componentOf(value)` → `Array`
Get all elements in the same set as `value`.

### `dsu.components()` → `Array<Array>`
Get all disjoint components as arrays of values.

### `dsu.componentCount` → `number`
Number of disjoint sets.

### `dsu.size` → `number`
Total number of elements.

### `dsu.has(value)` → `boolean`
Check if a value exists.

### `dsu.values()` → `Array`
Get all values.

### `dsu.toJSON()` / `DisjointSet.fromJSON(data)`
Serialize and restore the entire structure.

## Kruskal's MST

```js
import { kruskal } from 'disjoint-set';

// Graph: 4 nodes, weighted edges
const edges = [
  [0, 1, 1],  // node 0 — node 1, weight 1
  [1, 2, 2],
  [0, 2, 3],
  [2, 3, 4],
  [1, 3, 5],
];

const { mst, weight, connected } = kruskal(4, edges);
// mst: [[0,1,1], [1,2,2], [2,3,4]]
// weight: 7
// connected: true
```

## CLI

```bash
# Union elements
npx dsu union a b c d --elements=a,b,c,d
# Components: {a, b} {c, d}

# Check connectivity
npx dsu connected a b --elements=a,b,c,d
# Error: run union first... or use multiple commands

# Kruskal MST from stdin
echo "0 1 4
1 2 2
0 2 3" | npx dsu kruskal --elements=3

# See a demo
npx dsu demo
```

## Complexity

| Operation | Amortized |
|-----------|-----------|
| makeSet   | O(1)      |
| find      | O(α(n))   |
| union     | O(α(n))   |
| connected | O(α(n))   |

α(n) ≤ 5 for all practical values of n (universe has ~10⁸⁰ atoms).

## License

MIT
