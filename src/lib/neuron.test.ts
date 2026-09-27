import { describe, expect, it } from 'vitest';
import { branchPath, drawNeuron, flattenNeuron, hashUnit, type NeuronNodeInput } from './neuron';

const tree: NeuronNodeInput[] = [
  {
    key: 'res',
    children: [
      {
        key: 'res/internet',
        status: 'in-progress',
        children: [{ key: 'res/internet/b', status: 'awaiting-response', children: [] }],
      },
      { key: 'res/water', status: 'reported', children: [] },
    ],
  },
  { key: 'well', children: [{ key: 'well/food', status: 'resolved', children: [] }] },
];
const metrics = { rowHeight: 60, indent: 40, pad: 20 };

describe('flattenNeuron', () => {
  it('lists nodes in pre-order with depth, row, parent and path', () => {
    const rows = flattenNeuron(tree);
    expect(rows.map((r) => [r.key, r.depth, r.row])).toEqual([
      ['res', 1, 1],
      ['res/internet', 2, 2],
      ['res/internet/b', 3, 3],
      ['res/water', 2, 4],
      ['well', 1, 5],
      ['well/food', 2, 6],
    ]);
    expect(rows[2]).toMatchObject({
      parentKey: 'res/internet',
      path: ['res', 'res/internet', 'res/internet/b'],
    });
    expect(rows[0].parentKey).toBeNull();
  });

  it('stops at maxDepth', () => {
    expect(flattenNeuron(tree, 2).map((r) => r.key)).not.toContain('res/internet/b');
  });
});

describe('drawing', () => {
  it('is deterministic for the same key', () => {
    expect(hashUnit('res/internet')).toBe(hashUnit('res/internet'));
    expect(hashUnit('a')).not.toBe(hashUnit('b'));
    const a = branchPath({ x: 0, y: 0 }, { x: 40, y: 120 }, 'k', metrics);
    expect(branchPath({ x: 0, y: 0 }, { x: 40, y: 120 }, 'k', metrics)).toBe(a);
  });

  it('connects every node to its parent, with the soma as the root', () => {
    const drawing = drawNeuron(flattenNeuron(tree), metrics);
    expect(drawing.height).toBe(7 * 60);
    expect(drawing.soma).toMatchObject({ x: 20, y: 30 });
    const internet = drawing.nodes.find((n) => n.key === 'res/internet')!;
    expect(internet).toMatchObject({ x: 20 + 2 * 40, y: 2 * 60 + 30, status: 'in-progress' });
    // The branch to "res" starts at the soma; the one to "res/internet/b" starts at its parent.
    expect(drawing.branches[0].d.startsWith('M20 30 ')).toBe(true);
    expect(drawing.branches[2].d.startsWith(`M${internet.x} ${internet.y} `)).toBe(true);
    // Branches thin out with depth.
    expect(drawing.branches[0].width).toBeGreaterThan(drawing.branches[2].width);
  });
});
