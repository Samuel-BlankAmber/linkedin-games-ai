import { it, expect } from 'vitest'
import { solveQueens } from './queens-solver'

function printGrid(grid: string[][]) {
  const gridString = grid.map(row => row.join('')).join('\n');
  const colourMap: Record<string, string> = {
    '0': '🟪',
    '1': '🟧',
    '2': '🟦',
    '3': '🟩',
    '4': '🟥',
    '5': '🟨',
    '6': '⬜',
    '7': '⬛',
  };
  console.log(gridString.replace(/[0-7]/g, (match) => colourMap[match]));
}

it('Solve Queens #331', async () => {
  const grid = [
    ['0', '0', '0', '0', '0', '1', '1', '2'],
    ['0', '0', '0', '3', '1', '1', '2', '2'],
    ['0', '0', '3', '3', '1', '2', '2', '2'],
    ['0', '6', '6', '6', '6', '2', '4', '2'],
    ['0', '6', '6', '6', '6', '4', '4', '5'],
    ['0', '6', '6', '6', '6', '0', '4', '5'],
    ['0', '0', '7', '7', '0', '0', '5', '5'],
    ['0', '0', '0', '0', '0', '0', '0', '5'],
  ];
  const expectedSolution = [
    { row: 0, col: 0 },
    { row: 1, col: 4 },
    { row: 2, col: 2 },
    { row: 3, col: 5 },
    { row: 4, col: 1 },
    { row: 5, col: 6 },
    { row: 6, col: 3 },
    { row: 7, col: 7 },
  ];

  printGrid(grid);
  const solution = await solveQueens(grid);
  expect(solution).toEqual(expectedSolution);
});
