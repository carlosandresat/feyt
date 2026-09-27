// Geometry of the "neuron" tree drawing: one row per node, depth as indentation, organic curves
// from each parent down to its children. Pure functions (no DOM, no astro:*) so they can be tested
// and computed at build time; the component only renders the resulting SVG.

import type { Status } from './domain';

export interface NeuronNodeInput {
  key: string;
  status?: Status;
  children: NeuronNodeInput[];
}

export interface NeuronRow {
  key: string;
  /** 1 for the root's children; the root itself is the soma at depth 0. */
  depth: number;
  /** Row index; row 0 is the soma. */
  row: number;
  status?: Status;
  parentKey: string | null;
  /** Keys from the first level down to this node, inclusive. */
  path: string[];
}

export interface NeuronMetrics {
  rowHeight: number;
  indent: number;
  /** Left padding before the soma's center. */
  pad: number;
}

/** Pre-order flattening (parent before children), up to `maxDepth` levels below the soma. */
export function flattenNeuron(roots: NeuronNodeInput[], maxDepth = Infinity): NeuronRow[] {
  const rows: NeuronRow[] = [];
  const visit = (nodes: NeuronNodeInput[], depth: number, parent: NeuronRow | null) => {
    if (depth > maxDepth) return;
    for (const node of nodes) {
      const row: NeuronRow = {
        key: node.key,
        depth,
        row: rows.length + 1,
        status: node.status,
        parentKey: parent?.key ?? null,
        path: [...(parent?.path ?? []), node.key],
      };
      rows.push(row);
      visit(node.children, depth + 1, row);
    }
  };
  visit(roots, 1, null);
  return rows;
}

/** Deterministic pseudo-random number in [0, 1) from a string (FNV-1a). */
export function hashUnit(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 2 ** 32;
}

export function nodeCenter(depth: number, row: number, m: NeuronMetrics) {
  return { x: m.pad + depth * m.indent, y: row * m.rowHeight + m.rowHeight / 2 };
}

/** Branches thin out as they move away from the soma, like dendrites. */
export function branchWidth(depth: number): number {
  return Math.max(1.25, 4.5 - depth * 1.1);
}

export function nodeRadius(depth: number): number {
  return depth === 0 ? 11 : Math.max(4, 7.5 - depth);
}

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Cubic curve from a parent down to a child: it leaves the parent heading down (with a slight,
 * key-seeded sway so sibling branches don't overlap perfectly) and sweeps right into the child.
 */
export function branchPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  key: string,
  m: NeuronMetrics,
): string {
  const sway = (hashUnit(key) - 0.5) * m.indent * 0.5;
  const dy = to.y - from.y;
  const c1 = { x: from.x + sway * 0.4, y: from.y + dy * 0.6 };
  const c2 = { x: from.x + (to.x - from.x) * 0.15 + sway * 0.2, y: to.y };
  return (
    `M${round(from.x)} ${round(from.y)} ` +
    `C${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(to.x)} ${round(to.y)}`
  );
}

export interface NeuronDrawing {
  width: number;
  height: number;
  soma: { x: number; y: number; r: number };
  branches: { key: string; depth: number; d: string; width: number }[];
  nodes: { key: string; depth: number; x: number; y: number; r: number; status?: Status }[];
}

export function drawNeuron(rows: NeuronRow[], m: NeuronMetrics): NeuronDrawing {
  const soma = { ...nodeCenter(0, 0, m), r: nodeRadius(0) };
  const centers = new Map(rows.map((r) => [r.key, nodeCenter(r.depth, r.row, m)]));
  const maxDepth = Math.max(0, ...rows.map((r) => r.depth));
  return {
    width: Math.ceil(m.pad + maxDepth * m.indent + nodeRadius(1) + 12),
    height: (rows.length + 1) * m.rowHeight,
    soma,
    branches: rows.map((r) => ({
      key: r.key,
      depth: r.depth,
      d: branchPath(r.parentKey ? centers.get(r.parentKey)! : soma, centers.get(r.key)!, r.key, m),
      width: branchWidth(r.depth),
    })),
    nodes: rows.map((r) => ({
      key: r.key,
      depth: r.depth,
      ...centers.get(r.key)!,
      r: nodeRadius(r.depth),
      status: r.status,
    })),
  };
}
