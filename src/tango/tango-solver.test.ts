import { it, expect } from 'vitest'
import { GridConstraint, solveTango } from "./tango-solver";

function printGrid(grid: string[][]) {
  console.log(grid.map(row => row.join('')).join('\n').replaceAll('E', '⚫').replaceAll('S', '🌞').replaceAll('M', '🌜'));
}

it('Solves Tango #170', async () => {
  const grid = [
    [ 'E', 'E', 'E', 'E', 'E', 'E' ],
    [ 'E', 'E', 'E', 'S', 'S', 'M' ],
    [ 'M', 'S', 'M', 'E', 'E', 'E' ],
    [ 'E', 'E', 'E', 'E', 'E', 'E' ],
    [ 'E', 'E', 'E', 'E', 'E', 'E' ],
    [ 'E', 'E', 'E', 'S', 'M', 'M' ],
  ];
  const expectedGrid = [
    [ 'M', 'M', 'S', 'M', 'S', 'S' ],
    [ 'S', 'M', 'M', 'S', 'S', 'M' ],
    [ 'M', 'S', 'M', 'S', 'M', 'S' ],
    [ 'S', 'M', 'S', 'M', 'M', 'S' ],
    [ 'M', 'S', 'S', 'M', 'S', 'M' ],
    [ 'S', 'S', 'M', 'S', 'M', 'M' ]
  ];

  const gridConstraints: GridConstraint[] = [
    { cell1Index: 0, cell2Index: 1, constraint: 'same' },
    { cell1Index: 1, cell2Index: 2, constraint: 'different' },
    { cell1Index: 21, cell2Index: 22, constraint: 'same' },
    { cell1Index: 22, cell2Index: 23, constraint: 'different' },
    { cell1Index: 24, cell2Index: 25, constraint: 'different' },
    { cell1Index: 25, cell2Index: 26, constraint: 'same' },
  ];

  console.log("Initially:");
  printGrid(grid);
  await solveTango(grid, gridConstraints);
  expect(grid).toEqual(expectedGrid);
  console.log("Solved:");
  printGrid(grid);
});

it('Solves Tango #171', async () => {
  const grid = [
    [ 'E', 'E', 'E', 'E', 'E', 'E' ],
    [ 'M', 'E', 'E', 'E', 'E', 'E' ],
    [ 'E', 'E', 'E', 'M', 'E', 'E' ],
    [ 'E', 'E', 'M', 'E', 'E', 'E' ],
    [ 'E', 'E', 'E', 'E', 'E', 'M' ],
    [ 'E', 'E', 'E', 'E', 'E', 'E' ],
  ];
  const expectedGrid = [
    [ 'S', 'M', 'M', 'S', 'M', 'S' ],
    [ 'M', 'S', 'S', 'M', 'S', 'M' ],
    [ 'S', 'M', 'S', 'M', 'M', 'S' ],
    [ 'S', 'S', 'M', 'S', 'M', 'M' ],
    [ 'M', 'S', 'M', 'S', 'S', 'M' ],
    [ 'M', 'M', 'S', 'M', 'S', 'S' ]
  ];

  const gridConstraints: GridConstraint[] = [
    { cell1Index: 7, cell2Index: 8, constraint: 'same' },
    { cell1Index: 12, cell2Index: 13, constraint: 'different' },
    { cell1Index: 22, cell2Index: 23, constraint: 'same' },
    { cell1Index: 27, cell2Index: 28, constraint: 'same' },
  ];

  console.log("Initially:");
  printGrid(grid);
  await solveTango(grid, gridConstraints);
  expect(grid).toEqual(expectedGrid);
  console.log("Solved:");
  printGrid(grid);
});
