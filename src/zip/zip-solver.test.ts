import { it, expect } from 'vitest'
import { solveZip } from "./zip-solver";

it('Solves Zip #10', async () => {
  const grid = [
    [ 6, 0, 0, 0, 0, 5 ],
    [ 0, 0, 0, 0, 0, 0 ],
    [ 0, 7, 1, 8, 2, 0 ],
    [ 0, 0, 0, 0, 0, 0 ],
    [ 3, 0, 0, 0, 0, 4 ],
    [ 0, 0, 0, 0, 0, 0 ],
  ];
  const expectedSolution = [
    [ 27, 26, 25, 24, 23, 22 ],
    [ 28, 29,  2,  3,  4, 21 ],
    [ 31, 30,  1, 36,  5, 20 ],
    [ 32, 33, 34, 35,  6, 19 ],
    [ 11, 10,  9,  8,  7, 18 ],
    [ 12, 13, 14, 15, 16, 17 ],
  ];

  const solution = await solveZip(grid);
  expect(solution).toEqual(expectedSolution);
});
