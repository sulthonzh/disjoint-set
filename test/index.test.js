import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DisjointSet, kruskal } from '../src/index.js';

describe('DisjointSet — Basic', () => {
  it('starts with each element in its own set', () => {
    const dsu = new DisjointSet(['a', 'b', 'c']);
    assert.equal(dsu.size, 3);
    assert.equal(dsu.componentCount, 3);
  });

  it('empty DSU has 0 elements and 0 components', () => {
    const dsu = new DisjointSet();
    assert.equal(dsu.size, 0);
    assert.equal(dsu.componentCount, 0);
  });

  it('makeSet adds a new element', () => {
    const dsu = new DisjointSet();
    dsu.makeSet('x');
    assert.equal(dsu.size, 1);
    assert.equal(dsu.componentCount, 1);
  });

  it('makeSet throws on duplicate', () => {
    const dsu = new DisjointSet(['a']);
    assert.throws(() => dsu.makeSet('a'), /Duplicate/);
  });

  it('add is idempotent', () => {
    const dsu = new DisjointSet();
    dsu.add('a');
    dsu.add('a'); // no throw
    assert.equal(dsu.size, 1);
  });

  it('has checks membership', () => {
    const dsu = new DisjointSet(['a', 'b']);
    assert.equal(dsu.has('a'), true);
    assert.equal(dsu.has('z'), false);
  });
});

describe('DisjointSet — Union/Find', () => {
  it('union merges two sets', () => {
    const dsu = new DisjointSet(['a', 'b', 'c']);
    assert.equal(dsu.union('a', 'b'), true);
    assert.equal(dsu.componentCount, 2);
    assert.equal(dsu.connected('a', 'b'), true);
    assert.equal(dsu.connected('a', 'c'), false);
  });

  it('union returns false for same set', () => {
    const dsu = new DisjointSet(['a', 'b']);
    dsu.union('a', 'b');
    assert.equal(dsu.union('a', 'b'), false);
  });

  it('find returns the same root for connected elements', () => {
    const dsu = new DisjointSet(['a', 'b', 'c', 'd']);
    dsu.union('a', 'b');
    dsu.union('c', 'd');
    dsu.union('a', 'c');
    assert.equal(dsu.find('a'), dsu.find('b'));
    assert.equal(dsu.find('a'), dsu.find('c'));
    assert.equal(dsu.find('a'), dsu.find('d'));
  });

  it('find throws on missing element', () => {
    const dsu = new DisjointSet(['a']);
    assert.throws(() => dsu.find('z'), /not found/);
  });

  it('path compression makes find fast (tree stays flat)', () => {
    const dsu = new DisjointSet([0, 1, 2, 3, 4, 5, 6, 7]);
    // Chain: 0-1-2-3-4-5-6-7
    dsu.union(0, 1); dsu.union(1, 2); dsu.union(2, 3);
    dsu.union(3, 4); dsu.union(4, 5); dsu.union(5, 6); dsu.union(6, 7);
    // After find(7), the tree should be flattened
    dsu.find(7);
    // All nodes should now point close to root
    assert.equal(dsu.connected(0, 7), true);
  });
});

describe('DisjointSet — Size & Components', () => {
  it('setSize returns correct count', () => {
    const dsu = new DisjointSet(['a', 'b', 'c', 'd']);
    dsu.union('a', 'b');
    dsu.union('c', 'd');
    assert.equal(dsu.setSize('a'), 2);
    assert.equal(dsu.setSize('c'), 2);
    dsu.union('a', 'c');
    assert.equal(dsu.setSize('a'), 4);
  });

  it('componentOf returns all members', () => {
    const dsu = new DisjointSet(['a', 'b', 'c', 'd']);
    dsu.union('a', 'b');
    const comp = dsu.componentOf('a');
    assert.equal(comp.length, 2);
    assert.ok(comp.includes('a'));
    assert.ok(comp.includes('b'));
  });

  it('components returns all groups', () => {
    const dsu = new DisjointSet(['a', 'b', 'c', 'd', 'e']);
    dsu.union('a', 'b');
    dsu.union('d', 'e');
    const comps = dsu.components();
    assert.equal(comps.length, 3);
  });

  it('values returns all elements', () => {
    const dsu = new DisjointSet(['x', 'y', 'z']);
    assert.deepEqual(dsu.values().sort(), ['x', 'y', 'z']);
  });
});

describe('DisjointSet — Union by Rank', () => {
  it('smaller tree goes under larger tree', () => {
    const dsu = new DisjointSet([0, 1, 2, 3]);
    // {0,1} has rank 1 after union
    dsu.union(0, 1);
    // {2} alone has rank 0
    dsu.union(2, 3);
    // {2,3} has rank 1
    // Union {0,1} and {2,3} — same rank, one becomes root
    dsu.union(0, 2);
    assert.equal(dsu.componentCount, 1);
    // All connected
    for (let i = 0; i < 4; i++) {
      assert.equal(dsu.find(i), dsu.find(0));
    }
  });
});

describe('DisjointSet — Serialization', () => {
  it('toJSON / fromJSON round-trip preserves structure', () => {
    const dsu = new DisjointSet(['a', 'b', 'c', 'd']);
    dsu.union('a', 'b');
    dsu.union('c', 'd');
    dsu.union('a', 'c');
    const json = dsu.toJSON();
    const restored = DisjointSet.fromJSON(json);
    assert.equal(restored.size, 4);
    assert.equal(restored.componentCount, 1);
    assert.equal(restored.connected('a', 'd'), true);
  });

  it('toJSON captures correct component count', () => {
    const dsu = new DisjointSet(['a', 'b', 'c']);
    dsu.union('a', 'b');
    const json = dsu.toJSON();
    assert.equal(json.components, 2);
  });
});

describe('DisjointSet — Numeric values', () => {
  it('works with numeric values', () => {
    const dsu = new DisjointSet([1, 2, 3, 4, 5]);
    dsu.union(1, 2);
    dsu.union(3, 4);
    assert.equal(dsu.connected(1, 2), true);
    assert.equal(dsu.connected(1, 3), false);
    dsu.union(2, 3);
    assert.equal(dsu.connected(1, 4), true);
    assert.equal(dsu.setSize(1), 4);
  });
});

describe('DisjointSet — Stress test', () => {
  it('handles 10000 elements efficiently', () => {
    const n = 10000;
    const dsu = new DisjointSet(Array.from({ length: n }, (_, i) => i));
    // Union pairs
    for (let i = 0; i < n - 1; i++) dsu.union(i, i + 1);
    assert.equal(dsu.componentCount, 1);
    assert.equal(dsu.setSize(0), n);
    // Find should be near O(1) after compression
    assert.equal(dsu.connected(0, n - 1), true);
  });

  it('random unions maintain invariants', () => {
    const n = 1000;
    const dsu = new DisjointSet(Array.from({ length: n }, (_, i) => i));
    const rand = (max) => Math.floor(Math.random() * max);
    for (let i = 0; i < 500; i++) dsu.union(rand(n), rand(n));
    // All connected elements should have same root
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dsu.connected(i, j)) {
          assert.equal(dsu.find(i), dsu.find(j));
        }
      }
    }
  });
});

describe('DisjointSet — Edge cases', () => {
  it('union on same element is a no-op', () => {
    const dsu = new DisjointSet(['a']);
    assert.equal(dsu.union('a', 'a'), false);
    assert.equal(dsu.componentCount, 1);
  });

  it('chained unions don\'t create cycles', () => {
    const dsu = new DisjointSet(['a', 'b', 'c', 'd']);
    dsu.union('a', 'b');
    dsu.union('b', 'c');
    dsu.union('c', 'd');
    dsu.union('d', 'a'); // should be no-op, already connected
    assert.equal(dsu.componentCount, 1);
  });
});

describe('kruskal — MST', () => {
  it('finds minimum spanning tree', () => {
    // Graph: 4 nodes
    // 0-1 (1), 1-2 (2), 0-2 (3), 2-3 (4), 1-3 (5)
    const result = kruskal(4, [
      [0, 1, 1], [1, 2, 2], [0, 2, 3], [2, 3, 4], [1, 3, 5]
    ]);
    assert.equal(result.mst.length, 3); // n-1 edges
    assert.equal(result.weight, 7); // 1+2+4
    assert.equal(result.connected, true);
  });

  it('detects disconnected graph', () => {
    const result = kruskal(4, [[0, 1, 1], [2, 3, 1]]);
    assert.equal(result.connected, false);
    assert.equal(result.weight, 2);
  });

  it('single edge MST', () => {
    const result = kruskal(2, [[0, 1, 42]]);
    assert.equal(result.weight, 42);
    assert.equal(result.connected, true);
    assert.equal(result.mst.length, 1);
  });

  it('handles equal-weight edges', () => {
    const result = kruskal(3, [[0, 1, 5], [1, 2, 5], [0, 2, 5]]);
    assert.equal(result.weight, 10);
    assert.equal(result.mst.length, 2);
  });

  it('classic example: 9-node graph', () => {
    // Well-known graph
    const edges = [
      [0,1,4],[0,7,8],[1,2,8],[1,7,11],[2,3,7],[2,8,2],
      [2,5,4],[3,4,9],[3,5,14],[4,5,10],[5,6,2],[6,7,1],[6,8,6],[7,8,7]
    ];
    const result = kruskal(9, edges);
    assert.equal(result.connected, true);
    assert.equal(result.mst.length, 8);
    // Known MST weight for this graph = 37
    assert.equal(result.weight, 37);
  });
});
