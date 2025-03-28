import { it, expect } from 'vitest'
import { solveZip, Wall } from "./zip-solver";

it('Solves Zip #10', async () => {
  const grid = [
    [ 6, 0, 0, 0, 0, 5 ],
    [ 0, 0, 0, 0, 0, 0 ],
    [ 0, 7, 1, 8, 2, 0 ],
    [ 0, 0, 0, 0, 0, 0 ],
    [ 3, 0, 0, 0, 0, 4 ],
    [ 0, 0, 0, 0, 0, 0 ],
  ];
  const walls: Wall[] = [];
  const expectedSolution = [
    [ 27, 26, 25, 24, 23, 22 ],
    [ 28, 29,  2,  3,  4, 21 ],
    [ 31, 30,  1, 36,  5, 20 ],
    [ 32, 33, 34, 35,  6, 19 ],
    [ 11, 10,  9,  8,  7, 18 ],
    [ 12, 13, 14, 15, 16, 17 ],
  ];

  const solution = await solveZip(grid, walls);
  expect(solution).toEqual(expectedSolution);
});

it('Solves Zip #11', async () => {
  const grid = [
    [ 0, 0, 0, 0, 0, 0 ],
    [ 0, 0, 0, 5, 3, 0 ],
    [ 0, 0, 4, 0, 0, 0 ],
    [ 0, 0, 0, 2, 0, 0 ],
    [ 0, 1, 6, 0, 0, 0 ],
    [ 0, 0, 0, 0, 0, 0 ],
  ];
  const walls: Wall[] = [
    { start: { row: 0, col: 1 }, end: { row: 1, col: 1 } },
    { start: { row: 0, col: 2 }, end: { row: 1, col: 2 } },
    { start: { row: 1, col: 1 }, end: { row: 1, col: 2 } },
    { start: { row: 2, col: 1 }, end: { row: 2, col: 2 } },
    { start: { row: 2, col: 3 }, end: { row: 3, col: 3 } },
    { start: { row: 2, col: 4 }, end: { row: 3, col: 4 } },
    { start: { row: 3, col: 3 }, end: { row: 3, col: 4 } },
    { start: { row: 4, col: 3 }, end: { row: 4, col: 4 } },
  ];
  const expectedSolution = [
    [ 26, 25, 24, 23, 16, 15 ],
    [ 27, 28, 21, 22, 17, 14 ],
    [ 30, 29, 20, 19, 18, 13 ],
    [ 31,  2,  3,  4, 11, 12 ],
    [ 32,  1, 36,  5, 10,  9 ],
    [ 33, 34, 35,  6,  7,  8 ],
  ];

  const solution = await solveZip(grid, walls);
  expect(solution).toEqual(expectedSolution);
});
