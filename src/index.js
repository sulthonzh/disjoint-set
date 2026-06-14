/**
 * disjoint-set — Zero-dep Union-Find (Disjoint Set Union)
 *
 * Path compression + union by rank → O(α(n)) amortized per operation,
 * where α is the inverse Ackermann function (effectively constant).
 */

/**
 * @typedef {Object} DSUNode
 * @property {*} value
 * @property {number} parent  Index into nodes array
 * @property {number} rank
 * @property {number} size
 */

export class DisjointSet {
  /**
   * Create a new DisjointSet.
   * @param {Iterable<*>} [initial] — initial elements
   */
  constructor(initial) {
    /** @type {DSUNode[]} */
    this._nodes = [];
    /** @type {Map<*, number>} */
    this._index = new Map();
    this._components = 0;

    if (initial) {
      for (const v of initial) this.makeSet(v);
    }
  }

  /**
   * Add a new singleton set.
   * @param {*} value
   * @returns {number} index of the new element
   * @throws if value already exists
   */
  makeSet(value) {
    if (this._index.has(value)) {
      throw new Error(`Duplicate element: ${String(value)}`);
    }
    const idx = this._nodes.length;
    this._nodes.push({ value, parent: idx, rank: 0, size: 1 });
    this._index.set(value, idx);
    this._components++;
    return idx;
  }

  /**
   * Add an element if not already present (idempotent).
   * @param {*} value
   * @returns {number} index
   */
  add(value) {
    if (this._index.has(value)) return this._index.get(value);
    return this.makeSet(value);
  }

  /**
   * Find the root index for a value or index.
   * Uses path compression (iterative, halving).
   * @param {*} valueOrIndex
   * @returns {number} root index
   */
  find(valueOrIndex) {
    let idx = this._toIndex(valueOrIndex);
    // Path halving: point every other node up the tree
    while (this._nodes[idx].parent !== idx) {
      this._nodes[idx].parent = this._nodes[this._nodes[idx].parent].parent;
      idx = this._nodes[idx].parent;
    }
    return idx;
  }

  /**
   * Find the root value for a given element.
   * @param {*} value
   * @returns {*} root value
   */
  findValue(value) {
    return this._nodes[this.find(value)].value;
  }

  /**
   * Merge the sets containing a and b. Uses union by rank.
   * @param {*} a
   * @param {*} b
   * @returns {boolean} true if a merge happened, false if already same set
   */
  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;

    const nodeA = this._nodes[rootA];
    const nodeB = this._nodes[rootB];

    // Union by rank: attach smaller tree under larger
    if (nodeA.rank < nodeB.rank) {
      nodeA.parent = rootB;
      nodeB.size += nodeA.size;
    } else if (nodeA.rank > nodeB.rank) {
      nodeB.parent = rootA;
      nodeA.size += nodeB.size;
    } else {
      // Same rank: pick A as root, increment rank
      nodeB.parent = rootA;
      nodeA.rank++;
      nodeA.size += nodeB.size;
    }

    this._components--;
    return true;
  }

  /**
   * Check if two elements are in the same set.
   * @param {*} a
   * @param {*} b
   * @returns {boolean}
   */
  connected(a, b) {
    return this.find(a) === this.find(b);
  }

  /**
   * Get the size of the set containing value.
   * @param {*} value
   * @returns {number}
   */
  setSize(value) {
    return this._nodes[this.find(value)].size;
  }

  /**
   * Number of elements.
   * @returns {number}
   */
  get size() {
    return this._nodes.length;
  }

  /**
   * Number of disjoint components.
   * @returns {number}
   */
  get componentCount() {
    return this._components;
  }

  /**
   * Get all elements in the same set as value.
   * @param {*} value
   * @returns {Array<*>}
   */
  componentOf(value) {
    const root = this.find(value);
    return this._nodes
      .filter((_, i) => this.find(i) === root)
      .map((n) => n.value);
  }

  /**
   * Get all components as arrays of values.
   * @returns {Array<Array<*>>}
   */
  components() {
    const map = new Map();
    for (let i = 0; i < this._nodes.length; i++) {
      const root = this.find(i);
      if (!map.has(root)) map.set(root, []);
      map.get(root).push(this._nodes[i].value);
    }
    return [...map.values()];
  }

  /**
   * Check if a value exists in the structure.
   * @param {*} value
   * @returns {boolean}
   */
  has(value) {
    return this._index.has(value);
  }

  /**
   * Get all values.
   * @returns {Array<*>}
   */
  values() {
    return this._nodes.map((n) => n.value);
  }

  /**
   * Serialize to a plain object.
   * @returns {Object}
   */
  toJSON() {
    return {
      nodes: this._nodes.map((n) => ({
        value: n.value,
        parent: n.parent,
        rank: n.rank,
        size: n.size,
      })),
      components: this._components,
    };
  }

  /**
   * Deserialize from a plain object.
   * @param {Object} data
   * @returns {DisjointSet}
   */
  static fromJSON(data) {
    const dsu = new DisjointSet();
    dsu._nodes = data.nodes.map((n) => ({ ...n }));
    dsu._index = new Map(dsu._nodes.map((n, i) => [n.value, i]));
    dsu._components = data.components;
    return dsu;
  }

  /**
   * Convert a value or index to an index.
   * @param {*} valueOrIndex
   * @returns {number}
   * @private
   */
  _toIndex(valueOrIndex) {
    if (typeof valueOrIndex === 'number' && valueOrIndex >= 0 && valueOrIndex < this._nodes.length) {
      // Could be a numeric value or an index — check index map first
      if (this._index.has(valueOrIndex)) return this._index.get(valueOrIndex);
      return valueOrIndex;
    }
    if (this._index.has(valueOrIndex)) return this._index.get(valueOrIndex);
    throw new Error(`Element not found: ${String(valueOrIndex)}`);
  }
}

/**
 * Kruskal's algorithm for Minimum Spanning Tree using DisjointSet.
 *
 * @param {number} n — number of vertices (0-indexed)
 * @param {Array<[number, number, number]>} edges — [u, v, weight]
 * @returns {{ mst: Array<[number, number, number]>, weight: number, connected: boolean }}
 */
export function kruskal(n, edges) {
  const dsu = new DisjointSet(Array.from({ length: n }, (_, i) => i));
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  const mst = [];
  let weight = 0;

  for (const [u, v, w] of sorted) {
    if (!dsu.connected(u, v)) {
      dsu.union(u, v);
      mst.push([u, v, w]);
      weight += w;
    }
  }

  return { mst, weight, connected: dsu.componentCount === 1 };
}

export default DisjointSet;
