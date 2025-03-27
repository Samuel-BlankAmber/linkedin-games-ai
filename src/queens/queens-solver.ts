const { init } = require('z3-solver');

export interface Position {
  row: number;
  col: number;
}

export async function solveQueens(grid: string[][]): Promise<Position[]> {
  const { Context } = await init();
  const { Solver, Int, Or, Sum } = new Context('main');

  const numRows = grid.length;
  const numCols = grid[0].length;
  const gridZ3 = Array.from({ length: numRows }, (_, i) => Array.from({ length: numCols }, (_, j) => Int.const(`cell_${i}_${j}`)));
  const solver = new Solver();

  const regions: Record<string, Position[]> = {};
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      const cellZ3 = gridZ3[i][j];
      solver.add(Or(cellZ3.eq(0), cellZ3.eq(1)))

      const diagonalCellsZ3 = [];
      if (i > 0 && j > 0) {
        diagonalCellsZ3.push(gridZ3[i - 1][j - 1]);
      }
      if (i > 0 && j < numCols - 1) {
        diagonalCellsZ3.push(gridZ3[i - 1][j + 1]);
      }
      if (i < numRows - 1 && j > 0) {
        diagonalCellsZ3.push(gridZ3[i + 1][j - 1]);
      }
      if (i < numRows - 1 && j < numCols - 1) {
        diagonalCellsZ3.push(gridZ3[i + 1][j + 1]);
      }
      for (const diagonalCellZ3 of diagonalCellsZ3) {
        solver.add(Sum(cellZ3, diagonalCellZ3).le(1));
      }

      const value = grid[i][j];
      if (regions[value] === undefined) {
        regions[value] = [];
      }
      regions[value].push({ row: i, col: j });
    }
  }

  for (let i = 0; i < numRows; i++) {
    solver.add(Sum(...gridZ3[i]).eq(1));
  }

  for (let j = 0; j < numCols; j++) {
    const column = gridZ3.map(row => row[j]);
    solver.add(Sum(...column).eq(1));
  }

  for (const region of Object.values(regions)) {
    const cellsZ3 = region.map(({ row, col }) => gridZ3[row][col]);
    solver.add(Sum(...cellsZ3).eq(1));
  }

  const result = await solver.check();
  if (result === 'sat') {
    const model = solver.model();
    const queenPositions = [];
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        const cellValue = model.eval(gridZ3[i][j], true).value();
        if (cellValue === 1n) {
          queenPositions.push({ row: i, col: j });
        }
      }
    }
    return queenPositions;
  } else {
    throw new Error('Unsatisfiable');
  }
}
